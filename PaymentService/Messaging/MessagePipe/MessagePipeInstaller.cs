using Microsoft.Extensions.DependencyInjection;

namespace PaymentService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services)
    {
        services.AddMessagePipe().AddUdpInterprocess("127.0.0.1", 8084);
        services.AddScoped<PaymentMessageProcessor>();
        services.AddHostedService<PolicyCreatedHandler>();
        services.AddHostedService<PolicyTerminatedHandler>();
        return services;
    }
}