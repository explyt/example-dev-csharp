using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TestHelpers;
using Xunit;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace PolicyService.IntegrationTest;

public class PolicyControllerFixture : IAsyncLifetime
{
    public IAlbaHost PolicyHost { get; private set; }
    public IAlbaHost PricingHost { get; private set; }
    public IAlbaHost PolicySearchHost { get; private set; }

    public async Task InitializeAsync()
    {
        // Get a random available port for MessagePipe to avoid conflicts with parallel tests
        var messagePipePort = PortHelper.GetAvailablePort();

        var pricingBuilder = PricingService.Program.CreateWebHostBuilder([]);
        PricingHost = new AlbaHost(pricingBuilder);

        var pricingBase = PricingHost.Server.BaseAddress.ToString().TrimEnd('/');
        var pricingEndpoint = $"{pricingBase}/api/pricing";

        var policyBuilder = PolicyService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "PricingServiceUri", pricingEndpoint },
                    { "MessagePipe:Port", messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            })
            .ConfigureServices((Action<HostBuilderContext, IServiceCollection>)((ctx, services) =>
            {
                services.AddSingleton(_ =>
                {
                    var http = PricingHost.Server.CreateClient();
                    http.BaseAddress = new Uri(pricingEndpoint);
                    return RestEase.RestClient.For<PolicyService.RestClients.IPricingClient>(http);
                });
            }));

        PolicyHost = new AlbaHost(policyBuilder);

        var policySearchBuilder = PolicySearchService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "MessagePipe:Port", messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            });
        
        PolicySearchHost = new AlbaHost(policySearchBuilder);
    }

    /// <summary>
    /// Clears the policy search repository to ensure clean state between tests
    /// </summary>
    public async Task CleanupAsync()
    {
        var repository = PolicySearchHost?.Services.GetService<PolicySearchService.Domain.IPolicyRepository>();
        if (repository != null)
        {
            await repository.Clear();
        }
    }

    public async Task DisposeAsync()
    {
        if (PolicyHost != null) await PolicyHost.DisposeAsync();
        if (PricingHost != null) await PricingHost.DisposeAsync();
    }
}
