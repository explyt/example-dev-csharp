using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MessagePipe;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicySearchService.Messaging.MessagePipe;

public class PolicyMessageProcessor(IMediator mediator, ILogger<PolicyMessageProcessor> logger)
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