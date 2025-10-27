using Microsoft.Extensions.DependencyInjection;

namespace DashboardService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services)
    {
        services.AddMessagePipe().AddUdpInterprocess("127.0.0.1", 8084);
        services.AddScoped<DashboardMessageProcessor>();
        services.AddHostedService<PolicyCreatedHandler>();
        return services;
    }
}