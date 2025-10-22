using System.Threading.Tasks;
using MassTransit;
using MediatR;
using PolicyService.Api.Events;

namespace DashboardService.Messaging.MassTransit;

public class PolicyCreatedConsumer : IConsumer<PolicyCreated>
{
    private readonly IMediator mediator;

    public PolicyCreatedConsumer(IMediator mediator)
    {
        this.mediator = mediator;
    }

    public Task Consume(ConsumeContext<PolicyCreated> context)
    {
        return mediator.Publish(context.Message);
    }
}
