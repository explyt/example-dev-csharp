using System;
using System.Collections.Generic;
using MassTransit;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace PolicySearchService.Messaging.MassTransit;

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

public static class MassTransitListenersInstaller
{
    public static void UseMassTransitListeners(this IApplicationBuilder app)
    {
        // MassTransit starts automatically when the application starts
        // No additional setup needed here
    }
}