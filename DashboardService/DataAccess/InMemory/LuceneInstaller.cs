using DashboardService.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace DashboardService.DataAccess.InMemory;

public static class LuceneInstaller
{
    public static IServiceCollection AddLuceneSearch(this IServiceCollection services)
    {
        // Use a singleton so the in-memory Lucene index persists across scopes/requests
        services.AddSingleton<IPolicyRepository, LucenePolicyRepository>();
        return services;
    }
}
