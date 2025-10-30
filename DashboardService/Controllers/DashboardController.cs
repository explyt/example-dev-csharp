using System;
using System.Linq;
using System.Threading.Tasks;
using DashboardService.Api.Queries;
using DashboardService.Api.Queries.Dtos;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DashboardService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IMediator bus;

    public DashboardController(IMediator bus)
    {
        this.bus = bus;
    }

    // GET /api/Dashboard/agents-sales?salesDateFrom=...&salesDateTo=...&agentLogin=...&productCode=...
    [HttpGet("agents-sales")]
    public async Task<AgentsSalesResponse> AgentsSales(
        [FromQuery] DateTime salesDateFrom,
        [FromQuery] DateTime salesDateTo,
        [FromQuery] string? agentLogin,
        [FromQuery] string? productCode)
    {
        var result = await bus.Send(new GetAgentsSalesQuery
        {
            AgentLogin = agentLogin,
            ProductCode = productCode,
            SalesDateFrom = salesDateFrom,
            SalesDateTo = salesDateTo
        });

        var items = result.PerAgentTotal
            .Select(kv => new AgentSalesItem
            {
                AgentLogin = kv.Key,
                Sales = new SalesDto(kv.Value.PoliciesCount, kv.Value.PremiumAmount)
            })
            .ToList();

        return new AgentsSalesResponse
        {
            Items = items
        };
    }

    // GET /api/Dashboard/total-sales?salesDateFrom=...&salesDateTo=...
    [HttpGet("total-sales")]
    public async Task<TotalSalesResponse> TotalSales(
        [FromQuery] DateTime salesDateFrom,
        [FromQuery] DateTime salesDateTo,
        [FromQuery] string? productCode)
    {
        var result = await bus.Send(new GetTotalSalesQuery
        {
            ProductCode = productCode,
            SalesDateFrom = salesDateFrom,
            SalesDateTo = salesDateTo
        });

        var byProduct = result.PerProductTotal
            .Select(kv => new ProductSalesItem
            {
                ProductCode = kv.Key,
                Sales = new SalesDto(kv.Value.PoliciesCount, kv.Value.PremiumAmount)
            })
            .ToList();

        return new TotalSalesResponse
        {
            Overall = new SalesDto(result.Total.PoliciesCount, result.Total.PremiumAmount),
            ByProduct = byProduct
        };
    }

    // GET /api/Dashboard/sales-trends?salesDateFrom=...&salesDateTo=...&productCode=...&unit=Day|Week|Month|Quarter
    [HttpGet("sales-trends")]
    public async Task<SalesTrendsResponse> SalesTrends(
        [FromQuery] DateTime salesDateFrom,
        [FromQuery] DateTime salesDateTo,
        [FromQuery] string? productCode,
        [FromQuery] TimeUnit unit)
    {
        var result = await bus.Send(new GetSalesTrendsQuery
        {
            ProductCode = productCode,
            SalesDateFrom = salesDateFrom,
            SalesDateTo = salesDateTo,
            Unit = unit
        });

        var periods = result.PeriodsSales
            .Select(p => new PeriodItem
            {
                Date = p.PeriodDate,
                Label = p.Period,
                Sales = new SalesDto(p.Sales.PoliciesCount, p.Sales.PremiumAmount)
            })
            .ToList();

        return new SalesTrendsResponse
        {
            Periods = periods
        };
    }

    // GET /api/Dashboard/top-agents?...sorting/paging
    [HttpGet("top-agents")]
    public async Task<TopAgentsResponse> TopAgents(
        [FromQuery] DateTime salesDateFrom,
        [FromQuery] DateTime salesDateTo,
        [FromQuery] string? productCode,
        [FromQuery] string sortBy = "premiumAmount",
        [FromQuery] string order = "desc",
        [FromQuery] int limit = 10,
        [FromQuery] int offset = 0)
    {
        if (limit < 1) limit = 1; if (limit > 100) limit = 100; if (offset < 0) offset = 0;

        var baseResult = await bus.Send(new GetAgentsSalesQuery
        {
            ProductCode = productCode,
            SalesDateFrom = salesDateFrom,
            SalesDateTo = salesDateTo
        });

        var all = baseResult.PerAgentTotal
            .Select(kv => new TopAgentItem
            {
                AgentLogin = kv.Key,
                Sales = new SalesDto(kv.Value.PoliciesCount, kv.Value.PremiumAmount)
            });

        var ordered = (sortBy?.ToLowerInvariant()) switch
        {
            "policiescount" => all.OrderBy(a => a.Sales.PoliciesCount),
            _ => all.OrderBy(a => a.Sales.PremiumAmount)
        };

        var list = (string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase)
            ? ordered.OrderByDescending(x => 0) // stable trick to force materialization as IOrderedEnumerable
            : ordered).ToList();

        if (string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase))
        {
            list.Reverse();
        }
        var total = list.Count;
        var page = list.Skip(offset).Take(limit).ToList();

        // проставляем rank как глобальную позицию в отсортированном списке
        for (int i = 0; i < page.Count; i++)
        {
            page[i] = new TopAgentItem
            {
                Rank = offset + i + 1,
                AgentLogin = page[i].AgentLogin,
                Sales = page[i].Sales
            };
        }

        return new TopAgentsResponse
        {
            Total = total,
            Items = page
        };
    }
}
