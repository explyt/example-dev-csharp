using Microsoft.Extensions.DependencyInjection;
using NServiceBus;
using PolicyService.Messaging;
using PolicyService.Messaging.NServiceBus;

namespace PolicyService.Messaging.NServiceBus;

public static class NServiceBusInstaller
{
    public static IServiceCollection AddNServiceBus(this IServiceCollection services)
    {
        // Configure NServiceBus endpoint
        var endpointConfiguration = new EndpointConfiguration("PolicyService");
        
        var scanner = endpointConfiguration.AssemblyScanner();
        scanner.ExcludeAssemblies(
            "xunit.runner.utility.netcoreapp10.dll",
            "xunit.runner.visualstudio.dotnetcore.testadapter.dll",
            "PolicyService.IntegrationTest.dll" // Your test assembly
        );
        
        // Explicitly scan for handlers in the current assembly
        scanner.ScanAssembliesInNestedDirectories = true;
        scanner.ScanAppDomainAssemblies = true;
        
        // Use Learning Transport for local development
        var transport = endpointConfiguration.UseTransport<LearningTransport>();
        transport.StorageDirectory(".learningtransport");
        
        // Configure routing for events
        var routing = transport.Routing();
        routing.RouteToEndpoint(typeof(PolicyService.Api.Events.PolicyCreated), "PolicySearchService");
        routing.RouteToEndpoint(typeof(PolicyService.Api.Events.PolicyTerminated), "PolicySearchService");
        
        // Enable immediate retries for testing
        var recoverability = endpointConfiguration.Recoverability();
        recoverability.Immediate(immediate => immediate.NumberOfRetries(3));
        recoverability.Delayed(delayed => delayed.NumberOfRetries(0)); // Disable delayed retries for tests
        
        // Configure serializer
        endpointConfiguration.UseSerialization<SystemJsonSerializer>();
        
        // Enable installers for automatic setup
        endpointConfiguration.EnableInstallers();
        
        // Register NServiceBus endpoint (start it asynchronously)
        services.AddSingleton(provider =>
        {
            var endpoint = Endpoint.Start(endpointConfiguration).GetAwaiter().GetResult();
            return endpoint;
        });
        
        // Register IMessageSession as a scoped service
        services.AddScoped<IMessageSession>(provider => provider.GetRequiredService<IEndpointInstance>());
        
        // Replace the event publisher with NServiceBus publisher
        services.AddScoped<IEventPublisher, NServiceBusEventPublisher>();
        
        return services;
    }
}
