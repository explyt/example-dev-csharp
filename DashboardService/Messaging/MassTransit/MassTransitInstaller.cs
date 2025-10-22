using System;
using MassTransit;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using PolicyService.Api.Events;

namespace DashboardService.Messaging.MassTransit;

public static class MassTransitInstaller
{
    public static IServiceCollection AddMassTransitLocal(this IServiceCollection services)
    {
        services.AddMassTransit(x =>
        {
            x.AddConsumer<PolicyCreatedConsumer>();

            x.UsingInMemory((context, cfg) =>
            {
                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
