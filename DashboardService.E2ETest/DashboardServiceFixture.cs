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
    private IAlbaHost _policyHost;
    private IAlbaHost _pricingHost;
    private IAlbaHost _dashboardHost;
    private int _messagePipePort;

    public IAlbaHost PolicyHost => _policyHost;
    public IAlbaHost PricingHost => _pricingHost;
    public IAlbaHost DashboardHost => _dashboardHost;

    public async Task InitializeAsync()
    {
        // Get a random available port for MessagePipe to avoid conflicts with parallel tests
        _messagePipePort = PortHelper.GetAvailablePort();

        // Start Pricing Service
        var pricingBuilder = PricingService.Program.CreateWebHostBuilder([]);
        _pricingHost = new AlbaHost(pricingBuilder);

        var pricingBase = _pricingHost.Server.BaseAddress.ToString().TrimEnd('/');
        var pricingEndpoint = $"{pricingBase}/api/pricing";

        // Start Policy Service with Pricing Service dependency
        var policyBuilder = PolicyService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "PricingServiceUri", pricingEndpoint },
                    { "MessagePipe:Port", _messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            })
            .ConfigureServices((ctx, services) =>
            {
                services.AddSingleton(_ =>
                {
                    var http = _pricingHost.Server.CreateClient();
                    http.BaseAddress = new Uri(pricingEndpoint);
                    return RestEase.RestClient.For<PolicyService.RestClients.IPricingClient>(http);
                });
            });

        _policyHost = new AlbaHost(policyBuilder);

        // Start Dashboard Service with test configuration
        var dashboardBuilder = DashboardService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "MessagePipe:Port", _messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            });
        _dashboardHost = new AlbaHost(dashboardBuilder);

        // Give services time to fully initialize, especially MessagePipe endpoints
        await Task.Delay(2000);
    }

    /// <summary>
    /// Clears the dashboard repository to ensure clean state between tests
    /// </summary>
    public async Task CleanupAsync()
    {
        var repository = _dashboardHost?.Services.GetService<DashboardService.Domain.IPolicyRepository>();
        if (repository != null)
        {
            await repository.Clear();
        }
    }

    public async Task DisposeAsync()
    {
        if (_policyHost != null) await _policyHost.DisposeAsync();
        if (_pricingHost != null) await _pricingHost.DisposeAsync();
        if (_dashboardHost != null) await _dashboardHost.DisposeAsync();
    }
}
