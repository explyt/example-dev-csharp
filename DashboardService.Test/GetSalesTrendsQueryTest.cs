using System;
using System.Threading;
using System.Threading.Tasks;
using DashboardService.Api.Queries;
using DashboardService.Api.Queries.Dtos;
using DashboardService.DataAccess.InMemory;
using DashboardService.Queries;
using Xunit;

namespace DashboardService.Test;

[Collection("Lucene in memory")]
public class GetSalesTrendsQueryTest
{
    private readonly LuceneInMemoryFixture fixture;

    public GetSalesTrendsQueryTest(LuceneInMemoryFixture fixture)
    {
        this.fixture = fixture;
    }

    [Fact]
    public async Task SalesTrends_All_Product_In_First_Q_2020()
    {
        var queryHandler = new GetSalesTrendsHandler(fixture.Repository());

        var result = await queryHandler.Handle(new GetSalesTrendsQuery
            {
                Unit = TimeUnit.Month,
                SalesDateFrom = new DateTime(2020, 1, 1),
                SalesDateTo = new DateTime(2020, 3, 31)
            },
            CancellationToken.None);

        result
            .Should()
            .HavePeriods(3)
            .And
            .HaveSalesForMonth(2020, 1, 600M, 6)
            .And
            .HaveSalesForMonth(2020, 2, 355, 5)
            .And
            .HaveSalesForMonth(2020, 3, 890, 11);
    }

    [Fact]
    public async Task SalesTrends_HSI_Product_In_First_Q_2020()
    {
        var queryHandler = new GetSalesTrendsHandler(fixture.Repository());

        var result = await queryHandler.Handle(new GetSalesTrendsQuery
            {
                ProductCode = "HSI",
                Unit = TimeUnit.Month,
                SalesDateFrom = new DateTime(2020, 1, 1),
                SalesDateTo = new DateTime(2020, 3, 31)
            },
            CancellationToken.None);

        result
            .Should()
            .HavePeriods(3)
            .And
            .HaveSalesForMonth(2020, 1, 150M, 2)
            .And
            .HaveSalesForMonth(2020, 2, 105M, 2)
            .And
            .HaveSalesForMonth(2020, 3, 200M, 3);
    }
}