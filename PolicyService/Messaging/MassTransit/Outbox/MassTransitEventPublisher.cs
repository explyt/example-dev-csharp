using System.Threading.Tasks;
using MassTransit;
using PolicyService.Messaging;

namespace PolicyService.Messaging.MassTransit.Outbox;

public class MassTransitEventPublisher : IEventPublisher
{
    private readonly IPublishEndpoint _publishEndpoint;

    public MassTransitEventPublisher(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public async Task PublishMessage<T>(T msg)
    {
        await _publishEndpoint.Publish(msg);
    }
}
