using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using PolicyService.Messaging.MassTransit.Outbox;

namespace PolicyService.Messaging.MassTransit;

public static class MassTransitInstaller
{
    public static IServiceCollection AddMassTransitListeners(this IServiceCollection services)
    {
        services.AddMassTransit(x =>
        {
            x.SetKebabCaseEndpointNameFormatter();
            
            // Using in-memory transport for local development
            x.UsingInMemory((context, cfg) =>
            {
                cfg.ConfigureEndpoints(context);
            });

            // Add consumers for the events we want to handle
            x.AddConsumers(typeof(MassTransitInstaller).Assembly);
        });

        // Replace the outbox event publisher with MassTransit publisher
        services.AddScoped<IEventPublisher, MassTransitEventPublisher>();
        
        return services;
    }
}