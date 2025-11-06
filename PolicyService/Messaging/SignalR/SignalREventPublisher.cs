using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicyService.Messaging.SignalR;

public class SignalREventPublisher(IHubContext<EventsHub> hubContext, ILogger<SignalREventPublisher> logger)
    : IEventPublisher
{
    public async Task PublishMessage<T>(T msg)
    {
        try
        {
            logger.LogInformation("Publishing message of type {MessageType}", typeof(T).Name);

            switch (msg)
            {
                case PolicyCreated policyCreated:
                    await hubContext.Clients.All.SendAsync(EventsHub.PolicyCreatedMethod, policyCreated);
                    break;
                case PolicyTerminated policyTerminated:
                    await hubContext.Clients.All.SendAsync(EventsHub.PolicyTerminatedMethod, policyTerminated);
                    break;
                default:
                    logger.LogWarning("Unsupported message type: {MessageType}", typeof(T).Name);
                    return;
            }

            logger.LogInformation("Successfully published message of type {MessageType}", typeof(T).Name);
        }
        catch (System.Exception ex)
        {
            logger.LogError(ex, "Failed to publish message of type {MessageType}", typeof(T).Name);
            throw;
        }
    }
}
