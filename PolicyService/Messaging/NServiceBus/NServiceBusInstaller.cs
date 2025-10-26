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
        
        // Configure assembly scanning to exclude test assemblies
        var scanner = endpointConfiguration.AssemblyScanner();
        scanner.ExcludeAssemblies("xunit", "*/xunit.*", "PolicyService.IntegrationTest");
        
        // Use Learning Transport for local development
        var transport = endpointConfiguration.UseTransport<LearningTransport>();
        
        // Configure routing for events
        var routing = transport.Routing();
        routing.RouteToEndpoint(typeof(PolicyService.Api.Events.PolicyCreated), "PolicySearchService");
        routing.RouteToEndpoint(typeof(PolicyService.Api.Events.PolicyTerminated), "PolicySearchService");
        
        // Configure serializer
        endpointConfiguration.UseSerialization<SystemJsonSerializer>();
        
        // Enable installers for automatic setup
        endpointConfiguration.EnableInstallers();
        
        // Register NServiceBus endpoint
        var endpoint = Endpoint.Start(endpointConfiguration).GetAwaiter().GetResult();
        services.AddSingleton(endpoint);
        
        // Replace the event publisher with NServiceBus publisher
        services.AddScoped<IEventPublisher, NServiceBusEventPublisher>();
        
        return services;
    }
}
