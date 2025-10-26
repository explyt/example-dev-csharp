using System.Threading.Tasks;
using MessagePipe;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicyService.Messaging.MessagePipe;

public class MessagePipeEventPublisher : IEventPublisher
{
    private readonly IPublisher<PolicyCreated> _policyCreatedPublisher;
    private readonly IPublisher<PolicyTerminated> _policyTerminatedPublisher;
    private readonly ILogger<MessagePipeEventPublisher> _logger;

    public MessagePipeEventPublisher(
        IPublisher<PolicyCreated> policyCreatedPublisher,
        IPublisher<PolicyTerminated> policyTerminatedPublisher,
        ILogger<MessagePipeEventPublisher> logger)
    {
        _policyCreatedPublisher = policyCreatedPublisher;
        _policyTerminatedPublisher = policyTerminatedPublisher;
        _logger = logger;
    }

    public async Task PublishMessage<T>(T msg)
    {
        try
        {
            _logger.LogInformation("Publishing message of type {MessageType}", typeof(T).Name);
            
            switch (msg)
            {
                case PolicyCreated policyCreated:
                    _policyCreatedPublisher.Publish(policyCreated);
                    break;
                case PolicyTerminated policyTerminated:
                    _policyTerminatedPublisher.Publish(policyTerminated);
                    break;
                default:
                    _logger.LogWarning("Unsupported message type: {MessageType}", typeof(T).Name);
                    return;
            }
            
            _logger.LogInformation("Successfully published message of type {MessageType}", typeof(T).Name);
        }
        catch (System.Exception ex)
        {
            _logger.LogError(ex, "Failed to publish message of type {MessageType}", typeof(T).Name);
            throw;
        }
    }
}