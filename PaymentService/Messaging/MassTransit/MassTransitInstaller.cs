using MassTransit;
using Microsoft.Extensions.DependencyInjection;

namespace PaymentService.Messaging.MassTransit;

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

        return services;
    }
}