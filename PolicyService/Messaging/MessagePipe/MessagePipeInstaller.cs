using System.Diagnostics;
using MessagePipe;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;
using PolicyService.Messaging;

namespace PolicyService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services, IConfiguration configuration)
    {
        // Bind configuration
        var config = configuration.GetSection("MessagePipe").Get<MessagePipeConfiguration>() ?? new MessagePipeConfiguration();
        services.AddSingleton(config);
        
        // Register MessagePipe with TCP Interprocess for distributed messaging
        services.AddMessagePipe(options => { options.EnableCaptureStackTrace = true; })
            .AddTcpInterprocess(config.Host, config.Port, conf => { conf.HostAsServer = false; })
            .AddTcpInterprocess(config.Host, config.Port + 1, conf => { conf.HostAsServer = false; })
            .AddTcpInterprocess(config.Host, config.Port + 2, conf => { conf.HostAsServer = false; });
        
        // Register event publisher as Scoped to match the lifetime of MessagePipe dependencies
        services.AddScoped<IEventPublisher, MessagePipeEventPublisher>();
        
        return services;
    }
}
