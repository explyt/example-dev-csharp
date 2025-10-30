using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DashboardService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services, IConfiguration configuration)
    {
        var config = configuration.GetSection("MessagePipe").Get<MessagePipeConfiguration>() ??
                     new MessagePipeConfiguration();
        services.AddSingleton(config);

        services.AddMessagePipe(options => { options.EnableCaptureStackTrace = false; })
            .AddUdpInterprocess(config.Host, config.Port);
        services.AddScoped<DashboardMessageProcessor>();
        services.AddHostedService<PolicyCreatedHandler>();
        return services;
    }
}