using Microsoft.Extensions.DependencyInjection;

namespace PolicySearchService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services)
    {
        services.AddMessagePipe().AddUdpInterprocess("127.0.0.1", 8083);
        services.AddScoped<PolicyMessageProcessor>();
        services.AddHostedService<PolicyCreatedHandler>();
        return services;
    }
}
