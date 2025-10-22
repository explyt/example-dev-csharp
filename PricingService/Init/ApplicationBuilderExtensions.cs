using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace PricingService.Init;

public static class ApplicationBuilderExtensions
{
public static async Task UseInitializer(this IApplicationBuilder app)
    {
        using (var scope = app.ApplicationServices.CreateScope())
        {
            var initializer = scope.ServiceProvider.GetService<DataLoader>();
            if (initializer == null) return;

            try
            {
                await initializer.Seed();
            }
            catch
            {
                // Rethrow so the host can fail fast, but preserve stack for diagnostics.
                throw;
            }
        }
    }
}