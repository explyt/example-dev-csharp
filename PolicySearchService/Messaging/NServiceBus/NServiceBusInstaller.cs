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
        
        // Configure message conventions to ensure handlers are discovered
        var conventions = endpointConfiguration.Conventions();
        conventions.DefiningEventsAs(type => type.Namespace != null && type.Namespace.Contains("Events"));
        conventions.DefiningCommandsAs(type => type.Namespace != null && type.Namespace.Contains("Commands"));
        conventions.DefiningMessagesAs(type => type.Namespace != null && type.Namespace.Contains("Messages"));
        
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
        
        services.AddScoped<IMessageSession>(provider => provider.GetRequiredService<IEndpointInstance>());
        
        return services;
    }
}
