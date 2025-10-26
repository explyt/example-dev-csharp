using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using NServiceBus;

namespace PolicySearchService.Messaging.NServiceBus;

public static class NServiceBusInstaller
{
    public static IServiceCollection AddNServiceBus(this IServiceCollection services)
    {
        // Configure NServiceBus endpoint
        var endpointConfiguration = new EndpointConfiguration("PolicySearchService");

        var scanner = endpointConfiguration.AssemblyScanner();
        scanner.ExcludeAssemblies("xunit", "xunit.runner", "PolicySearchService.IntegrationTest");

        // Use Learning Transport for local development
        endpointConfiguration.UseTransport<LearningTransport>();
        
        // Configure serializer
        endpointConfiguration.UseSerialization<SystemJsonSerializer>();
        
        // Enable installers for automatic setup
        endpointConfiguration.EnableInstallers();
        
        // Register NServiceBus endpoint
        var endpoint = Endpoint.Start(endpointConfiguration).GetAwaiter().GetResult();
        services.AddSingleton(endpoint);
        
        return services;
    }
}
