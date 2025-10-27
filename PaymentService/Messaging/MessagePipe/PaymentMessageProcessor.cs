using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MessagePipe;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PaymentService.Messaging.MessagePipe;

public class PaymentMessageProcessor(IMediator mediator, ILogger<PaymentMessageProcessor> logger)
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

    public async Task ProcessPolicyTerminated(PolicyTerminated message, CancellationToken cancellationToken)
    {
        logger.LogInformation("Received PolicyTerminated event for policy number: {PolicyNumber}",
            message.PolicyNumber);
        Debug.WriteLine("Received PolicyTerminated event for policy number: {PolicyNumber}",
            message.PolicyNumber);

        // Publish the event to MediatR for internal handling
        await mediator.Publish(message, cancellationToken);

        logger.LogInformation("Successfully processed PolicyTerminated event for policy number: {PolicyNumber}",
            message.PolicyNumber);
        Debug.WriteLine("Successfully processed PolicyTerminated event for policy number: {PolicyNumber}",
            message.PolicyNumber);
    }
}