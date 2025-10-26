using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using NServiceBus;
using PolicyService.Api.Events;

namespace PolicySearchService.Messaging.NServiceBus;

public class PolicyCreatedHandler(IMediator mediator, ILogger<PolicyCreatedHandler> logger)
    : IHandleMessages<PolicyCreated>
{
    public async Task Handle(PolicyCreated message, IMessageHandlerContext context)
    {
        logger.LogInformation("Received PolicyCreated event for policy number: {PolicyNumber}", 
            message.PolicyNumber);
        
        // Publish the event to MediatR for internal handling
        await mediator.Publish(message, context.CancellationToken);
    }
}