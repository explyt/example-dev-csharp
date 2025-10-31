using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TestHelpers;
using Xunit;
using Xunit.Abstractions;

namespace DashboardService.E2ETest;

/// <summary>
/// Fixture for DashboardService E2E tests that manages service hosts lifecycle
/// and provides cleanup functionality between tests
/// </summary>
public class DashboardServiceFixture : IAsyncLifetime
{
    private IAlbaHost policyHost;
    private IAlbaHost pricingHost;
    private IAlbaHost dashboardHost;
    private int messagePipePort;

    public IAlbaHost PolicyHost => policyHost;
    public IAlbaHost PricingHost => pricingHost;
    public IAlbaHost DashboardHost => dashboardHost;

    public async Task InitializeAsync()
    {
        // Get a random available port for MessagePipe to avoid conflicts with parallel tests
        messagePipePort = PortHelper.GetAvailablePort();

        // Start Pricing Service
        var pricingBuilder = PricingService.Program.CreateWebHostBuilder([]);
        pricingHost = new AlbaHost(pricingBuilder);

        var pricingBase = pricingHost.Server.BaseAddress.ToString().TrimEnd('/');
        var pricingEndpoint = $"{pricingBase}/api/pricing";

        // Start Policy Service with Pricing Service dependency
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
            .ConfigureServices((ctx, services) =>
            {
                services.AddSingleton(_ =>
                {
                    var http = pricingHost.Server.CreateClient();
                    http.BaseAddress = new Uri(pricingEndpoint);
                    return RestEase.RestClient.For<PolicyService.RestClients.IPricingClient>(http);
                });
            });

        policyHost = new AlbaHost(policyBuilder);

        // Start Dashboard Service with test configuration
        var dashboardBuilder = DashboardService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "MessagePipe:Port", messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            });
        dashboardHost = new AlbaHost(dashboardBuilder);

        // Give services time to fully initialize, especially MessagePipe endpoints
        await Task.Delay(2000);
    }

    /// <summary>
    /// Clears the dashboard repository to ensure clean state between tests
    /// </summary>
    public async Task CleanupAsync()
    {
        var repository = dashboardHost?.Services.GetService<DashboardService.Domain.IPolicyRepository>();
        if (repository != null)
        {
            await repository.Clear();
        }
    }

    public async Task DisposeAsync()
    {
        if (policyHost != null) await policyHost.DisposeAsync();
        if (pricingHost != null) await pricingHost.DisposeAsync();
        if (dashboardHost != null) await dashboardHost.DisposeAsync();
    }
}
