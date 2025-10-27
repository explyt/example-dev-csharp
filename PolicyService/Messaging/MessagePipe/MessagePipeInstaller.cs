using System;
using System.Threading.Tasks;
using MessagePipe;
using Microsoft.Extensions.DependencyInjection;
using PolicyService.Api.Events;
using PolicyService.Messaging;

namespace PolicyService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services)
    {
        // Register MessagePipe with NamedPipeInterprocess for distributed messaging
        services.AddMessagePipe().AddUdpInterprocess("127.0.0.1", 8083);
        
        // Register event publisher as Scoped to match the lifetime of MessagePipe dependencies
        services.AddScoped<IEventPublisher, MessagePipeEventPublisher>();
        
        return services;
    }
}
