using System.Threading;
using System.Threading.Tasks;
using MediatR;
using MessagePipe;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicySearchService.Messaging.MessagePipe;

public class PolicyCreatedMessageHandler
{
    public PolicyCreatedMessageHandler(IMediator mediator,
        IDistributedSubscriber<string, PolicyCreated> subscriber,
        ILogger<PolicyCreatedMessageHandler> logger)
    {
        subscriber.SubscribeAsync("PolicyCreated", async (message, cancellationToken) =>
        {
            await mediator.Publish(message, cancellationToken);
        }).GetAwaiter().GetResult();
    }
}

public class PolicyCreatedHandler(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<PolicyCreatedHandler> logger
    ) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = serviceScopeFactory.CreateScope();
        var subscriber = scope.ServiceProvider.GetRequiredService<IDistributedSubscriber<string, PolicyCreated>>();
        
        await subscriber.SubscribeAsync("PolicyCreated", async (message, cancellationToken) =>
        {
            try
            {
                // Create a new scope for each message to handle scoped dependencies
                using var messageScope = serviceScopeFactory.CreateScope();
                var processor = messageScope.ServiceProvider.GetRequiredService<PolicyMessageProcessor>();

                await processor.ProcessPolicyCreated(message, cancellationToken);
            }
            catch (System.Exception ex)
            {
                logger.LogError(ex, "Failed to process PolicyCreated event for policy number: {PolicyNumber}",
                    message.PolicyNumber);
                throw;
            }
        }, cancellationToken: stoppingToken);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}