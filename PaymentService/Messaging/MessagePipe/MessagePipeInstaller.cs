using MessagePipe;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace PaymentService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services, IConfiguration configuration)
    {
        // Bind configuration
        var config = configuration.GetSection("MessagePipe").Get<MessagePipeConfiguration>() ?? new MessagePipeConfiguration();
        services.AddSingleton(config);
        
        // Register MessagePipe with TCP Interprocess for distributed messaging (changed from UDP)
        services.AddMessagePipe(options => { options.EnableCaptureStackTrace = false; })
            .AddUdpInterprocess(config.Host, config.Port);
        
        services.AddScoped<PaymentMessageProcessor>();
        services.AddHostedService<PolicyEventHandler>();
        return services;
    }
}
