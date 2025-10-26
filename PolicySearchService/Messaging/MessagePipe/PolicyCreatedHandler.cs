using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MessagePipe;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicySearchService.Messaging.MessagePipe;

public class PolicyCreatedHandler : IAsyncMessageHandler<PolicyCreated>
{
    private readonly IMediator _mediator;
    private readonly ILogger<PolicyCreatedHandler> _logger;

    public PolicyCreatedHandler(IMediator mediator, ILogger<PolicyCreatedHandler> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async ValueTask HandleAsync(PolicyCreated message, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Received PolicyCreated event for policy number: {PolicyNumber}", 
                message.PolicyNumber);
            
            // Publish the event to MediatR for internal handling
            await _mediator.Publish(message, cancellationToken);
            
            _logger.LogInformation("Successfully processed PolicyCreated event for policy number: {PolicyNumber}", 
                message.PolicyNumber);
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Failed to process PolicyCreated event for policy number: {PolicyNumber}", 
                message.PolicyNumber);
            throw;
        }
    }
}
