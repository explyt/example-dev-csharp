using System.Threading.Tasks;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicySearchService.Messaging.MassTransit;

public class PolicyCreatedConsumer : IConsumer<PolicyCreated>
{
    private readonly IMediator _mediator;
    private readonly ILogger<PolicyCreatedConsumer> _logger;

    public PolicyCreatedConsumer(IMediator mediator, ILogger<PolicyCreatedConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PolicyCreated> context)
    {
        _logger.LogInformation("Received PolicyCreated event for policy number: {PolicyNumber}", 
            context.Message.PolicyNumber);
        
        // Publish the event to MediatR for internal handling
        await _mediator.Publish(context.Message);
    }
}