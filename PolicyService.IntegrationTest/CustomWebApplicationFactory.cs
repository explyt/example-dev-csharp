using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PricingService.DataAccess.EfCore;
using PricingService.Domain;

namespace PricingService.IntegrationTest;

public class CustomWebApplicationFactory : WebApplicationFactory<PricingService.Program>
{
    protected override IHostBuilder CreateHostBuilder()
    {
        return PricingService.Program.CreateWebHostBuilder(Array.Empty<string>());
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // builder.UseEnvironment("Development");
        
        // Configure test services
        builder.ConfigureServices(services =>
        {
            // Add EF Core InMemory DbContext and EfDataStore for tests
            services.AddDbContext<PricingDbContext>(opt => opt.UseInMemoryDatabase("PricingInMemoryTest"));
            services.AddScoped<IDataStore, EfDataStore>();
        });
    }
}
