using Microsoft.Extensions.DependencyInjection;

namespace DashboardService.DataAccess.Elastic;

public static class NestInstaller
{
    public static IServiceCollection AddElasticSearch(this IServiceCollection services, string cnString)
    {
        // Elastic search support removed. Use AddLuceneSearch instead.
        return services;
    }
}
