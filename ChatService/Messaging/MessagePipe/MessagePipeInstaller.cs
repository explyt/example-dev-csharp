using Microsoft.Extensions.DependencyInjection;

namespace ChatService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services)
    {
        services.AddMessagePipe().AddUdpInterprocess("127.0.0.1", 8083);
        services.AddScoped<ChatMessageProcessor>();
        services.AddHostedService<PolicyCreatedHandler>();
        return services;
    }
}
