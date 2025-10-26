using System.Threading.Tasks;
using Alba;
using Xunit;

namespace PolicySearchService.IntegrationTest;


public class PolicySearchControllerFixture : IAsyncLifetime
{
    public IAlbaHost PolicySearchHost { get; private set; }

    public IAlbaHost SystemUnderTest => PolicySearchHost;

    public async Task InitializeAsync()
    {
        var builder = PolicySearchService.Program.CreateWebHostBuilder([]);
        
        PolicySearchHost = new AlbaHost(builder);
        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (PolicySearchHost != null) await PolicySearchHost.DisposeAsync();
    }
}
