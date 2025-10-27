using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MessagePipe;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace DashboardService.Messaging.MessagePipe;

public class DashboardMessageProcessor(IMediator mediator, ILogger<DashboardMessageProcessor> logger)
{
    public async Task ProcessPolicyCreated(PolicyCreated message, CancellationToken cancellationToken)
    {
        logger.LogInformation("Received PolicyCreated event for policy number: {PolicyNumber}",
            message.PolicyNumber);
        Debug.WriteLine("Received PolicyCreated event for policy number: {PolicyNumber}",
            message.PolicyNumber);

        // Publish the event to MediatR for internal handling
        await mediator.Publish(message, cancellationToken);

        logger.LogInformation("Successfully processed PolicyCreated event for policy number: {PolicyNumber}",
            message.PolicyNumber);
        Debug.WriteLine("Successfully processed PolicyCreated event for policy number: {PolicyNumber}",
            message.PolicyNumber);
    }
}