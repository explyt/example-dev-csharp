using System;
using System.Threading;
using System.Threading.Tasks;
using MessagePipe;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace ChatService.Messaging.MessagePipe;

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
                var processor = messageScope.ServiceProvider.GetRequiredService<ChatMessageProcessor>();

                await processor.ProcessPolicyCreated(message, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process PolicyCreated event for policy number: {PolicyNumber}",
                    message.PolicyNumber);
                throw;
            }
        }, cancellationToken: stoppingToken);

        logger.LogInformation("PolicyCreatedHandler started and listening for events");

        // Keep the handler running until cancellation is requested
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}
