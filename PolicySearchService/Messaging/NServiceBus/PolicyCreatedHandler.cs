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
        try
        {
            logger.LogInformation("Received PolicyCreated event for policy number: {PolicyNumber}", 
                message.PolicyNumber);
            
            // Publish the event to MediatR for internal handling
            await mediator.Publish(message, context.CancellationToken);
            
            logger.LogInformation("Successfully processed PolicyCreated event for policy number: {PolicyNumber}", 
                message.PolicyNumber);
        }
        catch (System.Exception ex)
        {
            logger.LogError(ex, "Failed to process PolicyCreated event for policy number: {PolicyNumber}", 
                message.PolicyNumber);
            throw;
        }
    }
}
