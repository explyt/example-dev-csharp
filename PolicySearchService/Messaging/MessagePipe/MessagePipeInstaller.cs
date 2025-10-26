using System;
using System.Threading.Tasks;
using MessagePipe;
using Microsoft.Extensions.DependencyInjection;
using PolicyService.Api.Events;

namespace PolicySearchService.Messaging.MessagePipe;

public static class MessagePipeInstaller
{
    public static IServiceCollection UseMessagePipe(this IServiceCollection services)
    {
        // Register MessagePipe
        services.AddMessagePipe().AddTcpInterprocess("localhost", 5065);
        
        // Register the PolicyCreated handler
        services.AddSingleton<IAsyncMessageHandler<PolicyCreated>, PolicyCreatedHandler>();
        
        // Register subscribers for interprocess communication
        services.AddSingleton<ISubscriber<PolicyCreated>>(provider =>
        {
            var options = provider.GetRequiredService<MessagePipeOptions>();
            return options.BuildServiceProvider().GetRequiredService<ISubscriber<PolicyCreated>>();
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
