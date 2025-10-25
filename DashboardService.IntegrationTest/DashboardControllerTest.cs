using System;
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
}

[CollectionDefinition("Dashboard service")]
public class DashboardServiceCollection : ICollectionFixture<DashboardControllerFixture>
{
}
