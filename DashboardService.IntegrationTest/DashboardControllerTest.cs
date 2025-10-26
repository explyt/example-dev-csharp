using System;
using System.Net;
using System.Threading.Tasks;
using Alba;
using DashboardService.Api.Queries;
using DashboardService.Api.Queries.Dtos;
using Xunit;
using static Xunit.Assert;

namespace DashboardService.IntegrationTest;

[Collection(nameof(DashboardControllerFixtureCollection))]
public class DashboardControllerTest(DashboardControllerFixture fixture)
{
    [Fact]
    public async Task CanGetTotalSales()
    {
        var query = new GetTotalSalesQuery
        {
            SalesDateFrom = DateTime.Now.AddMonths(-3).Date,
            SalesDateTo = DateTime.Now.Date
        };

        var scenarioResult = await fixture.DashboardHost.Scenario(s =>
        {
            s.Post.Json(query).ToUrl("/api/Dashboard/total-sales");
        });

        var result = scenarioResult.ReadAsJson<GetTotalSalesResult>();
        NotNull(result);
        True(result.Total.PoliciesCount > 0);
        True(result.Total.PremiumAmount > 0);
    }

    [Fact]
    public async Task CanGetAgentsSales()
    {
        var query = new GetAgentsSalesQuery
        {
            AgentLogin = "jimmy.solid",
            SalesDateFrom = DateTime.Now.AddMonths(-3).Date,
            SalesDateTo = DateTime.Now.Date
        };

        var scenarioResult = await fixture.DashboardHost.Scenario(s =>
        {
            s.Post.Json(query).ToUrl("/api/Dashboard/agents-sales");
        });

        var result = scenarioResult.ReadAsJson<GetAgentsSalesResult>();
        NotNull(result);
        True(result.PerAgentTotal.ContainsKey("jimmy.solid"));
        True(result.PerAgentTotal["jimmy.solid"].PoliciesCount > 0);
    }

    [Fact]
    public async Task CanGetSalesTrends()
    {
        var query = new GetSalesTrendsQuery
        {
            Unit = TimeUnit.Month,
            SalesDateFrom = DateTime.Now.AddMonths(-3).Date,
            SalesDateTo = DateTime.Now.Date
        };

        var scenarioResult = await fixture.DashboardHost.Scenario(s =>
        {
            s.Post.Json(query).ToUrl("/api/Dashboard/sales-trends");
        });

        var result = scenarioResult.ReadAsJson<GetSalesTrendsResult>();
        NotNull(result);
        True(result.PeriodsSales.Count > 0);
    }
    [Fact]
    public async Task GetAgentsSales_WithValidQuery_ReturnsSuccessResult()
    {
        var query = new GetAgentsSalesQuery
        {
            AgentLogin = "jimmy.solid",
            ProductCode = "TRI",
            SalesDateFrom = new DateTime(2024, 9, 1),
            SalesDateTo = new DateTime(2025, 10, 31)
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/agents-sales");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetAgentsSalesResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.PerAgentTotal);
    }

    [Fact]
    public async Task GetAgentsSales_WithInvalidDateRange_ReturnsEmptyResult()
    {
        var query = new GetAgentsSalesQuery
        {
            AgentLogin = "jimmy.solid",
            ProductCode = "TRI",
            SalesDateFrom = new DateTime(2030, 1, 1),
            SalesDateTo = new DateTime(2030, 12, 31)
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/agents-sales");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetAgentsSalesResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.PerAgentTotal);
        Assert.Empty(result.PerAgentTotal);
    }

    [Fact]
    public async Task GetTotalSales_WithValidQuery_ReturnsSuccessResult()
    {
        var query = new GetTotalSalesQuery
        {
            ProductCode = "TRI",
            SalesDateFrom = new DateTime(2024, 9, 1),
            SalesDateTo = new DateTime(2025, 10, 31)
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/total-sales");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetTotalSalesResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.Total);
        Assert.NotNull(result.PerProductTotal);
        Assert.True(result.Total.PoliciesCount >= 0);
        Assert.True(result.Total.PremiumAmount >= 0);
    }

    [Fact]
    public async Task GetTotalSales_WithInvalidProductCode_ReturnsEmptyResult()
    {
        var query = new GetTotalSalesQuery
        {
            ProductCode = "INVALID_PRODUCT",
            SalesDateFrom = new DateTime(2024, 9, 1),
            SalesDateTo = new DateTime(2025, 10, 31)
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/total-sales");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetTotalSalesResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.Total);
        Assert.Equal(0, result.Total.PoliciesCount);
        Assert.Equal(0, result.Total.PremiumAmount);
    }

    [Fact]
    public async Task GetSalesTrends_WithValidQuery_ReturnsSuccessResult()
    {
        var query = new GetSalesTrendsQuery
        {
            ProductCode = "TRI",
            SalesDateFrom = new DateTime(2024, 9, 1),
            SalesDateTo = new DateTime(2025, 10, 31),
            Unit = TimeUnit.Month
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/sales-trends");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetSalesTrendsResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.PeriodsSales);
        foreach (var periodSale in result.PeriodsSales)
        {
            Assert.NotNull(periodSale.Period);
            Assert.NotNull(periodSale.Sales);
            Assert.True(periodSale.Sales.PoliciesCount >= 0);
            Assert.True(periodSale.Sales.PremiumAmount >= 0);
        }
    }

    [Fact]
    public async Task GetSalesTrends_WithDifferentTimeUnits_ReturnsAppropriatePeriods()
    {
        var timeUnits = new[] { TimeUnit.Day, TimeUnit.Month, TimeUnit.Year };
        foreach (var unit in timeUnits)
        {
            var query = new GetSalesTrendsQuery
            {
                ProductCode = "TRI",
                SalesDateFrom = new DateTime(2024, 9, 1),
                SalesDateTo = new DateTime(2025, 10, 31),
                Unit = unit
            };

            var scenario = await fixture.DashboardHost.Scenario(_ =>
            {
                _.Post.Json(query).ToUrl("/api/Dashboard/sales-trends");
                _.StatusCodeShouldBeOk();
            });

            var result = scenario.ReadAsJson<GetSalesTrendsResult>();
            Assert.NotNull(result);
            Assert.NotNull(result.PeriodsSales);
        }
    }

    [Fact]
    public async Task GetSalesTrends_WithInvalidDateRange_ReturnsEmptyResult()
    {
        var query = new GetSalesTrendsQuery
        {
            ProductCode = "TRI",
            SalesDateFrom = new DateTime(2030, 1, 1),
            SalesDateTo = new DateTime(2030, 12, 31),
            Unit = TimeUnit.Month
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/sales-trends");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetSalesTrendsResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.PeriodsSales);
        Assert.Empty(result.PeriodsSales);
    }

    [Fact]
    public async Task GetAgentsSales_WithEmptyAgentLogin_ReturnsAllAgents()
    {
        var query = new GetAgentsSalesQuery
        {
            AgentLogin = null,
            ProductCode = "TRI",
            SalesDateFrom = new DateTime(2024, 9, 1),
            SalesDateTo = new DateTime(2025, 10, 31)
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/agents-sales");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetAgentsSalesResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.PerAgentTotal);
    }

    [Fact]
    public async Task GetTotalSales_WithEmptyProductCode_ReturnsAllProducts()
    {
        var query = new GetTotalSalesQuery
        {
            ProductCode = null,
            SalesDateFrom = new DateTime(2024, 9, 1),
            SalesDateTo = new DateTime(2025, 10, 31)
        };

        var scenario = await fixture.DashboardHost.Scenario(_ =>
        {
            _.Post.Json(query).ToUrl("/api/Dashboard/total-sales");
            _.StatusCodeShouldBeOk();
        });

        var result = scenario.ReadAsJson<GetTotalSalesResult>();
        Assert.NotNull(result);
        Assert.NotNull(result.Total);
        Assert.NotNull(result.PerProductTotal);
    }

    [Fact]
    public async Task InvalidEndpoint_ReturnsNotFound()
    {
        await fixture.DashboardHost.Scenario(_ =>
        {
            _.Get.Url("/api/Dashboard/invalid-endpoint");
            _.StatusCodeShouldBe(HttpStatusCode.NotFound);
        });
    }
}
