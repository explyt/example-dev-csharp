using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NServiceBus;

namespace PolicyService.Messaging.NServiceBus;

public class NServiceBusEventPublisher(IMessageSession messageSession, ILogger<NServiceBusEventPublisher> logger) : IEventPublisher
{
    public async Task PublishMessage<T>(T msg)
    {
        try
        {
            logger.LogInformation("Publishing message of type {MessageType}", typeof(T).Name);
            await messageSession.Publish(msg);
            logger.LogInformation("Successfully published message of type {MessageType}", typeof(T).Name);
        }
        catch (System.Exception ex)
        {
            logger.LogError(ex, "Failed to publish message of type {MessageType}", typeof(T).Name);
            throw;
        }
    }
}
