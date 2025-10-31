using MessagePipe;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace PolicySearchService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services, IConfiguration configuration)
    {
        // Bind configuration
        var config = configuration.GetSection("MessagePipe").Get<MessagePipeConfiguration>() ?? new MessagePipeConfiguration();
        services.AddSingleton(config);
        
        // Register MessagePipe with TCP Interprocess for distributed messaging
        services.AddMessagePipe(options => { options.EnableCaptureStackTrace = false; })
            .AddTcpInterprocess(config.Host, config.Port, conf => { conf.HostAsServer = true; });
        
        services.AddScoped<PolicyMessageProcessor>();
        services.AddHostedService<PolicyCreatedHandler>();
        return services;
    }
}
