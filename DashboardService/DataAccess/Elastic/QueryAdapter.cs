namespace DashboardService.DataAccess.Elastic;

public abstract class QueryAdapter<TQuery, TQueryResult, TIndex> where TIndex : class
{
    protected readonly TQuery query;

    protected QueryAdapter(TQuery query)
    {
        this.query = query;
    }

    // Elastic-specific query/response types removed. Keep adapter base as a marker only.
}
