using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace DashboardService.IntegrationTest;


public class DashboardControllerFixture : IAsyncLifetime
{
    public IAlbaHost DashboardHost { get; private set; }

    public IAlbaHost SystemUnderTest => DashboardHost;

    public async Task InitializeAsync()
    {
        var builder = DashboardService.Program.CreateWebHostBuilder([]);
        
        DashboardHost = new AlbaHost(builder);
        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (DashboardHost != null) await DashboardHost.DisposeAsync();
    }
}
