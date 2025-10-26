using System.Threading.Tasks;
using NServiceBus;

namespace PolicyService.Messaging.NServiceBus;

public class NServiceBusEventPublisher(IMessageSession messageSession) : IEventPublisher
{
    public async Task PublishMessage<T>(T msg)
    {
        await messageSession.Publish(msg);
    }
}
