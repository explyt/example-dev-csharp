using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PaymentService.Domain;

namespace PaymentService.DataAccess.EF;

public static class EFInstaller
{
    public static IServiceCollection AddEFConfiguration(this IServiceCollection services)
    {
        services.AddDbContext<PaymentDbContext>(options =>
        {
            options.UseInMemoryDatabase("Payments");
        });

        services.AddScoped<IPolicyAccountRepository, EFPolicyAccountRepository>();
        services.AddScoped<IDataStore, EFDataStore>();
        
        return services;
    }
}
