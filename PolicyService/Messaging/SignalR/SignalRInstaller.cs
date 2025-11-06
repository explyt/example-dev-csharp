using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace PolicyService.Messaging.SignalR;

public static class SignalRInstaller
{
    public static IServiceCollection UseSignalR(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSignalR();
        services.AddScoped<IEventPublisher, SignalREventPublisher>();
        
        return services;
    }
}
