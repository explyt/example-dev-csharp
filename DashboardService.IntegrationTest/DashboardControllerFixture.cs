using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TestHelpers;
using Xunit;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace DashboardService.IntegrationTest;


public class DashboardControllerFixture : IAsyncLifetime
{
    public IAlbaHost DashboardHost { get; private set; }

    public IAlbaHost SystemUnderTest => DashboardHost;

    public async Task InitializeAsync()
    {
        var builder = DashboardService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    {"SignalRHub:IsEnabled", "false"},
                };
                config.AddInMemoryCollection(overrides);
            });
        
        DashboardHost = new AlbaHost(builder);
        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (DashboardHost != null) await DashboardHost.DisposeAsync();
    }
}
