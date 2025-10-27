using System.Diagnostics;
using System.Threading.Tasks;
using MessagePipe;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicyService.Messaging.MessagePipe;

public class MessagePipeEventPublisher(
    IDistributedPublisher<string, PolicyCreated> policyCreatedPublisher,
    IDistributedPublisher<string, PolicyTerminated> policyTerminatedPublisher,
    ILogger<MessagePipeEventPublisher> logger
) : IEventPublisher
{
    public async Task PublishMessage<T>(T msg)
    {
        try
        {
            logger.LogInformation("Publishing message of type {MessageType}", typeof(T).Name);
            Debug.WriteLine("Publishing message of type {MessageType}", typeof(T).Name);

            switch (msg)
            {
                case PolicyCreated policyCreated:
                    await policyCreatedPublisher.PublishAsync("PolicyCreated", policyCreated);
                    break;
                case PolicyTerminated policyTerminated:
                    await policyTerminatedPublisher.PublishAsync("PolicyTerminated", policyTerminated);
                    break;
                default:
                    logger.LogWarning("Unsupported message type: {MessageType}", typeof(T).Name);
                    return;
            }

            logger.LogInformation("Successfully published message of type {MessageType}", typeof(T).Name);
            Debug.WriteLine("Successfully published message of type {MessageType}", typeof(T).Name);
        }
        catch (System.Exception ex)
        {
            logger.LogError(ex, "Failed to publish message of type {MessageType}", typeof(T).Name);
            throw;
        }
    }
}