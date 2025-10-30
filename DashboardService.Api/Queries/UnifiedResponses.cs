using System;
using System.Collections.Generic;
using DashboardService.Api.Queries.Dtos;

namespace DashboardService.Api.Queries;

// Unified response models for v2 API (GET-based)

public sealed class TotalSalesResponse
{
    public SalesDto Overall { get; init; } = new(0, 0);
    public IReadOnlyList<ProductSalesItem> ByProduct { get; init; } = Array.Empty<ProductSalesItem>();
}

public sealed class ProductSalesItem
{
    public string ProductCode { get; init; } = string.Empty;
    public SalesDto Sales { get; init; } = new(0, 0);
}

public sealed class AgentsSalesResponse
{
    public IReadOnlyList<AgentSalesItem> Items { get; init; } = Array.Empty<AgentSalesItem>();
}

public sealed class AgentSalesItem
{
    public string AgentLogin { get; init; } = string.Empty;
    public SalesDto Sales { get; init; } = new(0, 0);
}

public sealed class SalesTrendsResponse
{
    public IReadOnlyList<PeriodItem> Periods { get; init; } = Array.Empty<PeriodItem>();
}

public sealed class PeriodItem
{
    public DateTime Date { get; init; }
    public string? Label { get; init; }
    public SalesDto Sales { get; init; } = new(0, 0);
}

public sealed class TopAgentsResponse
{
    public long Total { get; init; }
    public IReadOnlyList<TopAgentItem> Items { get; init; } = Array.Empty<TopAgentItem>();
}

public sealed class TopAgentItem
{
    public int Rank { get; init; }
    public string AgentLogin { get; init; } = string.Empty;
    public SalesDto Sales { get; init; } = new(0, 0);
}
