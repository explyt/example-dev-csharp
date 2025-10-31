using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChatService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services, IConfiguration configuration)
    {
        var config = configuration.GetSection("MessagePipe").Get<MessagePipeConfiguration>() ??
                     new MessagePipeConfiguration();
        services.AddSingleton(config);

        services.AddMessagePipe(options => { options.EnableCaptureStackTrace = false; })
            .AddTcpInterprocess(config.Host, config.Port + 1, conf => { conf.HostAsServer = true; });
        services.AddScoped<ChatMessageProcessor>();
        services.AddHostedService<PolicyCreatedHandler>();
        return services;
    }
}
