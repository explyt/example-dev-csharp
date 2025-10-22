using DashboardService.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace DashboardService.DataAccess.InMemory;

public static class LuceneInstaller
{
    public static IServiceCollection AddLuceneSearch(this IServiceCollection services)
    {
        services.AddScoped<IPolicyRepository, LucenePolicyRepository>();
        return services;
    }
}