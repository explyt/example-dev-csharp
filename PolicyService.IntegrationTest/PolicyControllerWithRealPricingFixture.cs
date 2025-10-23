using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PolicyService.DataAccess.EfCore;
using PolicyService.Domain;
using PricingService.IntegrationTest;
using Xunit;

namespace PolicyService.IntegrationTest;

public class PolicyControllerWithRealPricingFixture : IAsyncLifetime
{
    private PolicyServiceWebApplicationFactory _factory;
    
    private CustomWebApplicationFactory _pricingFactory;
    
    public HttpClient PolicyClient { get; private set; }
    
    public HttpClient PricingClient { get; private set; }

    public async Task InitializeAsync()
    {
        _factory = new PolicyServiceWebApplicationFactory();
        _pricingFactory = new CustomWebApplicationFactory();
        PolicyClient = _factory.CreateClient();
        PricingClient = _pricingFactory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        PolicyClient?.Dispose();
        PricingClient?.Dispose();
        _factory?.Dispose();
        _pricingFactory?.Dispose();
    }
}

public class PolicyServiceWebApplicationFactory : WebApplicationFactory<PolicyService.Program>
{
    protected override IHostBuilder CreateHostBuilder()
    {
        return Host.CreateDefaultBuilder()
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<PolicyService.Startup>();
            });
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Configure test services
        builder.ConfigureServices(services =>
        {
            // Add EF Core InMemory DbContext for tests
            services.AddDbContext<PolicyDbContext>(opt => opt.UseInMemoryDatabase("PolicyInMemoryTest"));
            
            // Register repositories (already registered in Startup, but we can override if needed)
            services.AddScoped<IOfferRepository, EfOfferRepository>();
            services.AddScoped<IPolicyRepository, EfPolicyRepository>();
            services.AddScoped<IUnitOfWork, EfUnitOfWork>();
        });
    }
}
