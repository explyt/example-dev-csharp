using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AuthService.Domain;

namespace AuthService.DataAccess.EF;

public static class EFInstaller
{
    public static IServiceCollection AddEFConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AuthDbContext>(options =>
        {
            options.UseInMemoryDatabase("InsuranceAgents");
        });

        services.AddScoped<IInsuranceAgents, InsuranceAgentRepository>();
        return services;
    }
}
