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
        // Register MessagePipe
        services.AddMessagePipe().AddTcpInterprocess("localhost", 5040);
        
        // Register event publishers for different event types
        services.AddSingleton<IEventPublisher, MessagePipeEventPublisher>();
        
        // Register handlers for PolicyCreated events
        services.AddSingleton<ISubscriber<PolicyCreated>>(provider =>
        {
            var options = provider.GetRequiredService<MessagePipeOptions>();
            return options.BuildServiceProvider().GetRequiredService<ISubscriber<PolicyCreated>>();
        });
        
        // Register handlers for PolicyTerminated events
        services.AddSingleton<ISubscriber<PolicyTerminated>>(provider =>
        {
            var options = provider.GetRequiredService<MessagePipeOptions>();
            return options.BuildServiceProvider().GetRequiredService<ISubscriber<PolicyTerminated>>();
        });
        
        return services;
    }
}

public class MessagePipeOptions
{
    private readonly IServiceCollection _services;

    public MessagePipeOptions(IServiceCollection services)
    {
        _services = services;
    }

    public IServiceProvider BuildServiceProvider()
    {
        return _services.BuildServiceProvider();
    }
}