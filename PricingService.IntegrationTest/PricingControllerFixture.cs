using System;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace PricingService.IntegrationTest;

public class PricingControllerFixture : IAsyncLifetime
{
    public IAlbaHost SystemUnderTest { get; private set; }

    public Task InitializeAsync()
    {
        var hostBuilder = Program.CreateWebHostBuilder([]);

        SystemUnderTest = new AlbaHost(hostBuilder);
        return Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (SystemUnderTest == null) return;
        await SystemUnderTest.DisposeAsync();
    }

    protected Task SetupData()
    {
        return Task.CompletedTask;
    }
}
