using System;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace ProductService.IntegrationTest;

public class ProductControllerFixture : IAsyncLifetime
{
    public IAlbaHost SystemUnderTest { get; private set; }

    public Task InitializeAsync()
    {
        var hostBuilder = Program.CreateWebHostBuilder(Array.Empty<string>());

        SystemUnderTest = new AlbaHost(hostBuilder);
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        await SystemUnderTest.DisposeAsync();
    }

    protected virtual void SetupServices(HostBuilderContext ctx, IServiceCollection services)
    {
     
    }

    protected Task SetupData()
    {
        return Task.CompletedTask;
    }
}
