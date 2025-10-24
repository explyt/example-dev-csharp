using System;
using System.Threading.Tasks;
using Alba;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PricingService.DataAccess.EfCore;
using PricingService.Domain;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace PricingService.IntegrationTest;

public class PricingControllerFixture
{
    public IAlbaHost SystemUnderTest { get; private set; }

    public Task InitializeAsync()
    {
        var hostBuilder = Program.CreateWebHostBuilder(Array.Empty<string>())
            .ConfigureServices((Action<HostBuilderContext, IServiceCollection>)SetupServices);

        SystemUnderTest = new AlbaHost(hostBuilder);
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (SystemUnderTest == null) return;
        await SystemUnderTest.DisposeAsync();
    }

    protected virtual void SetupServices(HostBuilderContext ctx, IServiceCollection services)
    {
        // Add EF Core InMemory DbContext and EfDataStore for tests
        // services.AddDbContext<PricingDbContext>(opt => opt.UseInMemoryDatabase("PricingInMemoryTest"));
        // services.AddScoped<IDataStore, EfDataStore>();
    }

    protected Task SetupData()
    {
        return Task.CompletedTask;
    }
}