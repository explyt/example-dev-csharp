using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PolicyService.Api.Commands;
using PolicyService.Api.Commands.Dtos;
using PolicyService.Api.Queries;
using PolicySearchService.Api.Queries;
using PolicySearchService.Domain;
using Xunit;
using Xunit.Abstractions;
using static Xunit.Assert;

namespace PolicyService.IntegrationTest;

/// <summary>
/// Integration test that spans both PolicyService and PolicySearchService
/// Tests the complete flow: policy creation -> event publishing -> indexing -> search
/// </summary>
public class PolicyServiceToPolicySearchServiceIntegrationTest(ITestOutputHelper testOutputHelper) : IAsyncLifetime
{
    private IAlbaHost policyHost;
    private IAlbaHost pricingHost;
    private IAlbaHost policySearchHost;
    
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

        // Start Policy Search Service with test logging
        var policySearchBuilder = PolicySearchService.Program.CreateWebHostBuilder([]);

        policySearchHost = new AlbaHost(policySearchBuilder);

        // Give services time to fully initialize, especially NServiceBus endpoints
        await Task.Delay(2000);
    }

    private void LuceneCleanup()
    {
        policySearchHost?.Services.GetService<IPolicyRepository>().Clear();
    }
    
    public async Task DisposeAsync()
    {
        if (policyHost != null) await policyHost.DisposeAsync();
        if (pricingHost != null) await pricingHost.DisposeAsync();
        if (policySearchHost != null) await policySearchHost.DisposeAsync();
    }

    /// <summary>
    /// Scenario: Complete policy lifecycle from creation to search
    /// Given: Customer creates a travel insurance policy
    /// When: Policy is created successfully
    /// Then: Policy should be indexed and searchable in PolicySearchService
    /// </summary>
    [Fact]
    public async Task PolicyCreation_Should_BeIndexedAndSearchable()
    {
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

        // Step 4: Wait for event processing and verify policy is searchable
        var policyNumber = createPolicyResult.PolicyNumber;
        var policyHolderName = "John Doe";

        // Try searching multiple times with a delay to account for eventual consistency
        FindPolicyResult searchResult = null;
        var maxAttempts = 3;
        var delayMs = 1000;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            var searchScenario = await policySearchHost.Scenario(scenario =>
            {
                scenario.Get.Url($"/api/PolicySearch?q={policyNumber}");
                scenario.StatusCodeShouldBeOk();
            });

            searchResult = await searchScenario.ReadAsJsonAsync<FindPolicyResult>();

            if (searchResult?.Policies?.Count > 0)
            {
                testOutputHelper.WriteLine($"Policy found in search results after {attempt + 1} attempts");
                break;
            }
            else
            {
                testOutputHelper.WriteLine($"Attempt {attempt + 1}: No policies found in search results");
            }

            await Task.Delay(delayMs);
        }

        // Step 5: Verify search results
        NotNull(searchResult);
        NotNull(searchResult.Policies);
        True(searchResult.Policies.Count > 0, "Policy should be found in search results");

        var foundPolicy = searchResult.Policies[0];
        Equal(policyNumber, foundPolicy.PolicyNumber);
        Equal("TRI", foundPolicy.ProductCode);
        Equal(policyHolderName, foundPolicy.PolicyHolder);
        True(foundPolicy.PremiumAmount > 0);

        // Step 6: Verify search by policy holder name also works
        var searchByNameScenario = await policySearchHost.Scenario(_ =>
        {
            _.Get.Url($"/api/PolicySearch?q={policyHolderName}");
            _.StatusCodeShouldBeOk();
        });

        var searchByNameResult = await searchByNameScenario.ReadAsJsonAsync<FindPolicyResult>();
        NotNull(searchByNameResult);
        NotNull(searchByNameResult.Policies);
        True(searchByNameResult.Policies.Count > 0, "Policy should be found when searching by policy holder name");

        var foundByNamePolicy = searchByNameResult.Policies[0];
        Equal(policyNumber, foundByNamePolicy.PolicyNumber);
        Equal(policyHolderName, foundByNamePolicy.PolicyHolder);
        
        LuceneCleanup();
    }

    /// <summary>
    /// Scenario: Multiple policies creation and search
    /// Given: Multiple policies are created with different policy holders
    /// When: Policies are created successfully
    /// Then: All policies should be indexed and searchable with correct filtering
    /// </summary>
    [Fact]
    public async Task MultiplePoliciesCreation_Should_BeProperlyIndexedAndSearchable()
    {
        var policyNumbers = new List<string>();
        var policyHolders = new[] { "Alice Smith", "Bob Johnson", "Carol Williams" };

        // Create multiple policies
        foreach (var policyHolder in policyHolders)
        {
            // Create offer
            var createOfferCommand = new CreateOfferCommand
            {
                ProductCode = "TRI",
                PolicyFrom = DateTime.Now.AddDays(5),
                PolicyTo = DateTime.Now.AddDays(10),
                SelectedCovers = new List<string> { "C1" },
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
                _.StatusCodeShouldBeOk();
            });

            var createOfferResult = await offerScenario.ReadAsJsonAsync<CreateOfferResult>();

            // Create policy
            var names = policyHolder.Split(' ');
            var createPolicyCommand = new CreatePolicyCommand
            {
                OfferNumber = createOfferResult.OfferNumber,
                PolicyHolder = new PersonDto
                {
                    FirstName = names[0],
                    LastName = names[1],
                    TaxId = $"TAX{policyNumbers.Count}"
                },
                PolicyHolderAddress = new AddressDto
                {
                    Country = "PL",
                    ZipCode = "00-001",
                    City = "Warsaw",
                    Street = $"Street {policyNumbers.Count}"
                }
            };

            var policyScenario = await policyHost.Scenario(_ =>
            {
                _.Post.Json(createPolicyCommand).ToUrl("/api/Policy");
                _.StatusCodeShouldBeOk();
            });

            var createPolicyResult = await policyScenario.ReadAsJsonAsync<CreatePolicyResult>();
            policyNumbers.Add(createPolicyResult.PolicyNumber);
        }

        // Wait for all events to be processed
        await Task.Delay(2000);

        // Verify all policies are searchable
        foreach (var policyNumber in policyNumbers)
        {
            var searchScenario = await policySearchHost.Scenario(_ =>
            {
                _.Get.Url($"/api/PolicySearch?q={policyNumber}");
                _.StatusCodeShouldBeOk();
            });

            var searchResult = await searchScenario.ReadAsJsonAsync<FindPolicyResult>();
            NotNull(searchResult);
            NotNull(searchResult.Policies);
            True(searchResult.Policies.Count > 0, $"Policy {policyNumber} should be found in search results");
            Equal(policyNumber, searchResult.Policies[0].PolicyNumber);
        }

        // Verify search returns all policies when searching for common term
        var allPoliciesScenario = await policySearchHost.Scenario(_ =>
        {
            _.Get.Url("/api/PolicySearch?q=TRI");
            _.StatusCodeShouldBeOk();
        });

        var allPoliciesResult = await allPoliciesScenario.ReadAsJsonAsync<FindPolicyResult>();
        NotNull(allPoliciesResult);
        NotNull(allPoliciesResult.Policies);
        True(allPoliciesResult.Policies.Count >= policyNumbers.Count,
            $"Should find at least {policyNumbers.Count} policies when searching by product code");
        
        LuceneCleanup();
    }
}