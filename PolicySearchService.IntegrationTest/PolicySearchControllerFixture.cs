using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace PolicySearchService.IntegrationTest;


public class PolicySearchControllerFixture : IAsyncLifetime
{
    public IAlbaHost PolicySearchHost { get; private set; }
    
    public async Task InitializeAsync()
    {
        var builder = Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "SignalRHub:IsEnabled", "false" }
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
