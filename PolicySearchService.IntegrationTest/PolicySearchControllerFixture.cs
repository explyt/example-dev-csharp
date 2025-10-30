using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.Configuration;
using TestHelpers;
using Xunit;

namespace PolicySearchService.IntegrationTest;


public class PolicySearchControllerFixture : IAsyncLifetime
{
    public IAlbaHost PolicySearchHost { get; private set; }

    public IAlbaHost SystemUnderTest => PolicySearchHost;

    public async Task InitializeAsync()
    {
        // Get a random available port for MessagePipe to avoid conflicts with parallel tests
        var messagePipePort = PortHelper.GetAvailablePort();

        var builder = PolicySearchService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "MessagePipe:Port", messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            });
        
        PolicySearchHost = new AlbaHost(builder);
        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        if (PolicySearchHost != null) await PolicySearchHost.DisposeAsync();
    }
}
