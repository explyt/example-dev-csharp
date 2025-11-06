using Microsoft.Extensions.DependencyInjection;
using PolicySearchService.Domain;

namespace PolicySearchService.DataAccess.InMemory;

public static class LuceneInstaller
{
    public static IServiceCollection AddLuceneSearch(this IServiceCollection services)
    {
        services.AddSingleton<IPolicyRepository, LucenePolicyRepository>();
        return services;
    }
}
