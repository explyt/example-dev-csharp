using System;
using DashboardService.Domain;

namespace DashboardService.DataAccess.Elastic;

public class ElasticPolicyRepository : IPolicyRepository
{
    public void Save(PolicyDocument policy) => throw new NotImplementedException();
    public PolicyDocument FindByNumber(string policyNumber) => throw new NotImplementedException();
    public AgentSalesQueryResult GetAgentSales(AgentSalesQuery query) => throw new NotImplementedException();
    public TotalSalesQueryResult GetTotalSales(TotalSalesQuery query) => throw new NotImplementedException();
    public SalesTrendsResult GetSalesTrend(SalesTrendsQuery query) => throw new NotImplementedException();
}
