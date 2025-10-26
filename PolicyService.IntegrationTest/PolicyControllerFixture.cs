using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace PolicyService.IntegrationTest;

public class PolicyControllerFixture : IAsyncLifetime
{
    public IAlbaHost PolicyHost { get; private set; }
    public IAlbaHost PricingHost { get; private set; }

    public IAlbaHost SystemUnderTest => PolicyHost;

    public async Task InitializeAsync()
    {
        var pricingBuilder = PricingService.Program.CreateWebHostBuilder([]);
        PricingHost = new AlbaHost(pricingBuilder);

        var pricingBase = PricingHost.Server.BaseAddress.ToString().TrimEnd('/');
        var pricingEndpoint = $"{pricingBase}/api/pricing";

        var policyBuilder = PolicyService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "PricingServiceUri", pricingEndpoint }
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
    }

    public async Task DisposeAsync()
    {
        if (PolicyHost != null) await PolicyHost.DisposeAsync();
        if (PricingHost != null) await PricingHost.DisposeAsync();
    }
}
