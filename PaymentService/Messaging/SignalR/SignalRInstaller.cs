using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace PaymentService.Messaging.SignalR;

public static class SignalRInstaller
{
    public static IServiceCollection UseSignalR(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSignalR();
        services.AddHostedService<PolicyCreatedSubscriber>();

        return services;
    }
}
