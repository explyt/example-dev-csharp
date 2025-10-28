using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace ChatService.Messaging.MessagePipe;

public class ChatMessageProcessor(IMediator mediator, ILogger<ChatMessageProcessor> logger)
{
    public async Task ProcessPolicyCreated(PolicyCreated message, CancellationToken cancellationToken)
    {
        logger.LogInformation("Received PolicyCreated event for policy number: {PolicyNumber}",
            message.PolicyNumber);

        await mediator.Publish(message, cancellationToken);

        logger.LogInformation("Successfully processed PolicyCreated event for policy number: {PolicyNumber}",
            message.PolicyNumber);
    }
}
