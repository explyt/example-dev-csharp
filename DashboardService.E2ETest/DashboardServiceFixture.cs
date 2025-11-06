using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using HostBuilderContext = Microsoft.Extensions.Hosting.HostBuilderContext;

namespace DashboardService.E2ETest;

public class DashboardServiceFixture : IAsyncLifetime
{
    public IAlbaHost PolicyHost { get; private set; }
    public IAlbaHost PricingHost { get; private set; }
    public IAlbaHost DashboardHost { get; private set; }
    public HubConnection SignalRConnection { get; private set; }

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

        var dashboardBuilder = DashboardService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "SignalRHub:Url", signalRHubUrl },
                    { "SignalRHub:IsEnabled", "true" }
                };
                config.AddInMemoryCollection(overrides);
            }).ConfigureServices((Action<HostBuilderContext, IServiceCollection>)((_, services) =>
            {
                services.AddSingleton(PolicyHost.Server.CreateHandler());
            }));
        DashboardHost = new AlbaHost(dashboardBuilder);
    }

    /// <summary>
    /// Clears the dashboard repository to ensure clean state between tests
    /// </summary>
    public async Task CleanupAsync()
    {
        var repository = DashboardHost?.Services.GetService<DashboardService.Domain.IPolicyRepository>();
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
        if (DashboardHost != null) await DashboardHost.DisposeAsync();
    }
}