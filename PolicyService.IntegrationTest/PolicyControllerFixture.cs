using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace PolicyService.IntegrationTest;

// ReSharper disable once ClassNeverInstantiated.Global
public class PolicyControllerFixture : IAsyncLifetime
{
    public IAlbaHost PolicyHost { get; private set; }
    private IAlbaHost PricingHost { get; set; }
    public IAlbaHost PolicySearchHost { get; private set; }
    private HubConnection SignalRConnection { get; set; }

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
                    { "PricingServiceUri", pricingEndpoint },
                };
                config.AddInMemoryCollection(overrides);
            })
            .ConfigureServices((Action<HostBuilderContext, IServiceCollection>)((_, services) =>
            {
                services.AddSingleton(_ =>
                {
                    var http = PricingHost.Server.CreateClient();
                    http.BaseAddress = new Uri(pricingEndpoint);
                    return RestEase.RestClient.For<PolicyService.RestClients.IPricingClient>(http);
                });
            }));

        PolicyHost = new AlbaHost(policyBuilder);
        
        var policyBase = PolicyHost.Server.BaseAddress.ToString().TrimEnd('/');
        var signalRHubUrl = $"{policyBase}/events";
        
        SignalRConnection = new HubConnectionBuilder()
            .WithUrl(signalRHubUrl, options =>
            {
                options.HttpMessageHandlerFactory = _ => PolicyHost.Server.CreateHandler();
            })
            .WithAutomaticReconnect()
            .Build();
        
        await SignalRConnection.StartAsync();

        var policySearchBuilder = PolicySearchService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "PolicyServiceUri", policyBase },
                    { "SignalRHub:Url", signalRHubUrl },
                    { "SignalRHub:IsEnabled", "true" }
                };
                config.AddInMemoryCollection(overrides);
            })
            .ConfigureServices((Action<HostBuilderContext, IServiceCollection>)((_, services) =>
            {
                services.AddSingleton(PolicyHost.Server.CreateHandler());
            }));
        
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
        if (SignalRConnection != null)
        {
            await SignalRConnection.StopAsync();
            await SignalRConnection.DisposeAsync();
        }
        if (PolicyHost != null) await PolicyHost.DisposeAsync();
        if (PricingHost != null) await PricingHost.DisposeAsync();
        if (PolicySearchHost != null) await PolicySearchHost.DisposeAsync();
    }
}
