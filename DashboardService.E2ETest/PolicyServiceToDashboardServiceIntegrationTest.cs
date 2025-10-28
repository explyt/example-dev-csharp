using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using DashboardService.Api.Queries;
using DashboardService.Api.Queries.Dtos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PolicyService.Api.Commands;
using PolicyService.Api.Commands.Dtos;
using PolicyService.Api.Queries;
using Xunit;
using Xunit.Abstractions;
using static Xunit.Assert;

namespace DashboardService.E2ETest;

/// <summary>
/// End-to-end integration test that spans PolicyService, PricingService, and DashboardService
/// Tests the complete flow: policy creation -> event publishing -> dashboard analytics
/// </summary>
public class PolicyServiceToDashboardServiceIntegrationTest(ITestOutputHelper testOutputHelper) : IAsyncLifetime
{
    private IAlbaHost policyHost;
    private IAlbaHost pricingHost;
    private IAlbaHost dashboardHost;
    
    public async Task InitializeAsync()
    {
        // Start Pricing Service
        var pricingBuilder = PricingService.Program.CreateWebHostBuilder([]);
        pricingHost = new AlbaHost(pricingBuilder);

        var pricingBase = pricingHost.Server.BaseAddress.ToString().TrimEnd('/');
        var pricingEndpoint = $"{pricingBase}/api/pricing";

        // Start Policy Service with Pricing Service dependency
        var policyBuilder = PolicyService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "PricingServiceUri", pricingEndpoint }
                };
                config.AddInMemoryCollection(overrides);
            })
            .ConfigureServices((ctx, services) =>
            {
                services.AddSingleton(_ =>
                {
                    var http = pricingHost.Server.CreateClient();
                    http.BaseAddress = new Uri(pricingEndpoint);
                    return RestEase.RestClient.For<PolicyService.RestClients.IPricingClient>(http);
                });
            });

        policyHost = new AlbaHost(policyBuilder);

        // Start Dashboard Service
        var dashboardBuilder = DashboardService.Program.CreateWebHostBuilder([]);
        dashboardHost = new AlbaHost(dashboardBuilder);

        // Give services time to fully initialize, especially MessagePipe endpoints
        await Task.Delay(2000);
    }

    private void DashboardCleanup()
    {
        dashboardHost?.Services.GetService<DashboardService.Domain.IPolicyRepository>().Clear();
    }
    
    public async Task DisposeAsync()
    {
        if (policyHost != null) await policyHost.DisposeAsync();
        if (pricingHost != null) await pricingHost.DisposeAsync();
        if (dashboardHost != null) await dashboardHost.DisposeAsync();
    }

    /// <summary>
    /// Scenario: Complete policy lifecycle from creation to dashboard analytics
    /// Given: Agent creates a travel insurance policy
    /// When: Policy is created successfully
    /// Then: Policy should be reflected in DashboardService analytics
    /// </summary>
    [Fact]
    public async Task PolicyCreation_Should_UpdateDashboardAnalytics()
    {
        DashboardCleanup();
        
        const string agentLogin = "jimmy.solid";
        
        // Step 1: Create an offer first
        var createOfferCommand = new CreateOfferCommand
        {
            ProductCode = "TRI",
            PolicyFrom = DateTime.Now.AddDays(5),
            PolicyTo = DateTime.Now.AddDays(10),
            SelectedCovers = new List<string> { "C1", "C2", "C3" },
            Answers = new List<QuestionAnswer>
            {
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_CHILDREN", Answer = 1M },
                new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
            }
        };

        var offerScenario = await policyHost.Scenario(scenario =>
        {
            scenario.Post.Json(createOfferCommand).ToUrl("/api/Offer");
            scenario.WithRequestHeader("AgentLogin", agentLogin);
            scenario.StatusCodeShouldBeOk();
        });

        var createOfferResult = await offerScenario.ReadAsJsonAsync<CreateOfferResult>();
        NotNull(createOfferResult);
        NotNull(createOfferResult.OfferNumber);
        True(createOfferResult.TotalPrice > 0);

        // Step 2: Create a policy using the offer
        var createPolicyCommand = new CreatePolicyCommand
        {
            OfferNumber = createOfferResult.OfferNumber,
            PolicyHolder = new PersonDto
            {
                FirstName = "John",
                LastName = "Doe",
                TaxId = "123456789"
            },
            PolicyHolderAddress = new AddressDto
            {
                Country = "PL",
                ZipCode = "00-001",
                City = "Warsaw",
                Street = "Main Street 123"
            }
        };

        var policyScenario = await policyHost.Scenario(scenario =>
        {
            scenario.Post.Json(createPolicyCommand).ToUrl("/api/Policy");
            scenario.StatusCodeShouldBeOk();
        });

        var createPolicyResult = await policyScenario.ReadAsJsonAsync<CreatePolicyResult>();
        NotNull(createPolicyResult);
        NotNull(createPolicyResult.PolicyNumber);

        // we need to wait for messages to be transferred
        await Task.Delay(1000);
        
        // Step 3: Verify policy was created in PolicyService
        var getPolicyScenario = await policyHost.Scenario(scenario =>
        {
            scenario.Get.Url($"/api/Policy/{createPolicyResult.PolicyNumber}");
            scenario.StatusCodeShouldBeOk();
        });

        var policyDetails = await getPolicyScenario.ReadAsJsonAsync<GetPolicyDetailsQueryResult>();
        NotNull(policyDetails);
        NotNull(policyDetails.Policy);
        Equal(createPolicyResult.PolicyNumber, policyDetails.Policy.Number);

        // Step 4: Wait for event processing and verify dashboard analytics are updated
        var policyNumber = createPolicyResult.PolicyNumber;
        var saleDate = DateTime.Now;

        // Try querying dashboard multiple times with a delay to account for eventual consistency
        GetTotalSalesResult totalSalesResult = null;
        GetAgentsSalesResult agentSalesResult = null;
        var maxAttempts = 5;
        var delayMs = 1000;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            // Check total sales
            var totalSalesQuery = new GetTotalSalesQuery
            {
                SalesDateFrom = saleDate.AddDays(-1),
                SalesDateTo = saleDate.AddDays(1)
            };

            var totalSalesScenario = await dashboardHost.Scenario(scenario =>
            {
                scenario.Post.Json(totalSalesQuery).ToUrl("/api/Dashboard/total-sales");
                scenario.StatusCodeShouldBeOk();
            });

            totalSalesResult = await totalSalesScenario.ReadAsJsonAsync<GetTotalSalesResult>();

            // Check agent sales
            var agentSalesQuery = new GetAgentsSalesQuery
            {
                AgentLogin = agentLogin,
                SalesDateFrom = saleDate.AddDays(-1),
                SalesDateTo = saleDate.AddDays(1)
            };

            var agentSalesScenario = await dashboardHost.Scenario(scenario =>
            {
                scenario.Post.Json(agentSalesQuery).ToUrl("/api/Dashboard/agents-sales");
                scenario.StatusCodeShouldBeOk();
            });

            agentSalesResult = await agentSalesScenario.ReadAsJsonAsync<GetAgentsSalesResult>();

            if (totalSalesResult?.Total?.PoliciesCount > 0 && agentSalesResult?.PerAgentTotal?.Count > 0)
            {
                testOutputHelper.WriteLine($"Dashboard analytics updated after {attempt + 1} attempts");
                break;
            }
            else
            {
                testOutputHelper.WriteLine($"Attempt {attempt + 1}: Dashboard analytics not yet updated");
            }

            await Task.Delay(delayMs);
        }

        // Step 5: Verify total sales analytics
        NotNull(totalSalesResult);
        NotNull(totalSalesResult.Total);
        True(totalSalesResult.Total.PoliciesCount > 0, "Total sales should show at least one policy");
        True(totalSalesResult.Total.PremiumAmount > 0, "Total premium amount should be positive");

        // Step 6: Verify agent-specific sales analytics
        NotNull(agentSalesResult);
        NotNull(agentSalesResult.PerAgentTotal);
        True(agentSalesResult.PerAgentTotal.Count > 0, "Agent sales should show at least one agent");

        True(agentSalesResult.PerAgentTotal.ContainsKey(agentLogin), $"Agent {agentLogin} should be in sales results");
        var agentTotal = agentSalesResult.PerAgentTotal[agentLogin];
        True(agentTotal.PoliciesCount > 0, $"Agent {agentLogin} should have at least one policy");
        True(agentTotal.PremiumAmount > 0, $"Agent {agentLogin} should have positive premium amount");

        // Step 7: Verify sales trends
        var salesTrendsQuery = new GetSalesTrendsQuery
        {
            SalesDateFrom = saleDate.AddMonths(-1),
            SalesDateTo = saleDate.AddMonths(1),
            Unit = TimeUnit.Day
        };

        var salesTrendsScenario = await dashboardHost.Scenario(scenario =>
        {
            scenario.Post.Json(salesTrendsQuery).ToUrl("/api/Dashboard/sales-trends");
            scenario.StatusCodeShouldBeOk();
        });

        var salesTrendsResult = await salesTrendsScenario.ReadAsJsonAsync<GetSalesTrendsResult>();
        NotNull(salesTrendsResult);
        NotNull(salesTrendsResult.PeriodsSales);
        True(salesTrendsResult.PeriodsSales.Count > 0, "Sales trends should show data for the period");

        DashboardCleanup();
    }

    /// <summary>
    /// Scenario: Multiple policies creation with different agents
    /// Given: Multiple agents create policies
    /// When: Policies are created successfully
    /// Then: Dashboard should show correct aggregation and attribution
    /// </summary>
    [Fact]
    public async Task MultiplePoliciesWithDifferentAgents_Should_ShowCorrectAggregation()
    {
        DashboardCleanup();
        var agents = new[] { "jimmy.solid", "anna.kowalsky", "tom.smith" };
        var policyCounts = new Dictionary<string, int>();

        // Create multiple policies with different agents
        foreach (var agent in agents)
        {
            var policiesToCreate = agent == "jimmy.solid" ? 2 : 1; // Jimmy creates 2 policies
            policyCounts[agent] = policiesToCreate;

            for (int i = 0; i < policiesToCreate; i++)
            {
                // Create offer
                var createOfferCommand = new CreateOfferCommand
                {
                    ProductCode = "TRI",
                    PolicyFrom = DateTime.Now.AddDays(5),
                    PolicyTo = DateTime.Now.AddDays(10),
                    SelectedCovers = new List<string> { "C1", "C2" },
                    Answers = new List<QuestionAnswer>
                    {
                        new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
                        new NumericQuestionAnswer { QuestionCode = "NUM_OF_CHILDREN", Answer = 1M },
                        new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
                    }
                };

                var offerScenario = await policyHost.Scenario(_ =>
                {
                    _.Post.Json(createOfferCommand).ToUrl("/api/Offer");
                    _.WithRequestHeader("AgentLogin", agent);
                    _.StatusCodeShouldBeOk();
                });

                var createOfferResult = await offerScenario.ReadAsJsonAsync<CreateOfferResult>();

                // Create policy
                var createPolicyCommand = new CreatePolicyCommand
                {
                    OfferNumber = createOfferResult.OfferNumber,
                    PolicyHolder = new PersonDto
                    {
                        FirstName = $"Customer{i}",
                        LastName = $"Agent{agent}",
                        TaxId = $"TAX{agent}{i}"
                    },
                    PolicyHolderAddress = new AddressDto
                    {
                        Country = "PL",
                        ZipCode = "00-001",
                        City = "Warsaw",
                        Street = $"Street {i}"
                    }
                };

                var policyScenario = await policyHost.Scenario(_ =>
                {
                    _.Post.Json(createPolicyCommand).ToUrl("/api/Policy");
                    _.StatusCodeShouldBeOk();
                });

                var createPolicyResult = await policyScenario.ReadAsJsonAsync<CreatePolicyResult>();
            }
        }

        // Wait for all events to be processed
        await Task.Delay(3000);

        // Verify total sales aggregation
        var totalSalesQuery = new GetTotalSalesQuery
        {
            SalesDateFrom = DateTime.Now.AddDays(-1),
            SalesDateTo = DateTime.Now.AddDays(1)
        };

        var totalSalesScenario = await dashboardHost.Scenario(_ =>
        {
            _.Post.Json(totalSalesQuery).ToUrl("/api/Dashboard/total-sales");
            _.StatusCodeShouldBeOk();
        });

        var totalSalesResult = await totalSalesScenario.ReadAsJsonAsync<GetTotalSalesResult>();
        NotNull(totalSalesResult);
        NotNull(totalSalesResult.Total);
        
        var totalExpectedPolicies = agents.Length + 1; // 3 agents + 1 extra for jimmy's second policy
        Equal(totalExpectedPolicies, totalSalesResult.Total.PoliciesCount);
        True(totalSalesResult.Total.PremiumAmount > 0);

        // Verify agent-specific sales
        foreach (var agent in agents)
        {
            var agentSalesQuery = new GetAgentsSalesQuery
            {
                AgentLogin = agent,
                SalesDateFrom = DateTime.Now.AddDays(-1),
                SalesDateTo = DateTime.Now.AddDays(1)
            };

            var agentSalesScenario = await dashboardHost.Scenario(_ =>
            {
                _.Post.Json(agentSalesQuery).ToUrl("/api/Dashboard/agents-sales");
                _.StatusCodeShouldBeOk();
            });

            var agentSalesResult = await agentSalesScenario.ReadAsJsonAsync<GetAgentsSalesResult>();
            NotNull(agentSalesResult);
            NotNull(agentSalesResult.PerAgentTotal);
            True(agentSalesResult.PerAgentTotal.Count > 0, $"Should have sales data for agent {agent}");

            True(agentSalesResult.PerAgentTotal.ContainsKey(agent), $"Agent {agent} should be in sales results");
            var agentTotal = agentSalesResult.PerAgentTotal[agent];
            Equal((long)policyCounts[agent], agentTotal.PoliciesCount);
            True(agentTotal.PremiumAmount > 0, $"Agent {agent} should have positive premium");
        }

        // Verify sales trends show correct data
        var salesTrendsQuery = new GetSalesTrendsQuery
        {
            SalesDateFrom = DateTime.Now.AddDays(-1),
            SalesDateTo = DateTime.Now.AddDays(1),
            Unit = TimeUnit.Day
        };

        var salesTrendsScenario = await dashboardHost.Scenario(_ =>
        {
            _.Post.Json(salesTrendsQuery).ToUrl("/api/Dashboard/sales-trends");
            _.StatusCodeShouldBeOk();
        });

        var salesTrendsResult = await salesTrendsScenario.ReadAsJsonAsync<GetSalesTrendsResult>();
        NotNull(salesTrendsResult);
        NotNull(salesTrendsResult.PeriodsSales);
        
        // Should have at least one period with sales
        var hasSales = false;
        foreach (var period in salesTrendsResult.PeriodsSales)
        {
            if (period.Sales.PoliciesCount > 0)
            {
                hasSales = true;
                break;
            }
        }
        True(hasSales, "Sales trends should show at least one period with sales");
    }
}