using System.Threading;
using System.Threading.Tasks;
using MessagePipe;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PaymentService.Messaging.MessagePipe;

public class PolicyTerminatedHandler(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<PolicyTerminatedHandler> logger
    ) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = serviceScopeFactory.CreateScope();
        var subscriber = scope.ServiceProvider.GetRequiredService<IDistributedSubscriber<string, PolicyTerminated>>();
        
        await subscriber.SubscribeAsync("PolicyTerminated", async (message, cancellationToken) =>
        {
            try
            {
                // Create a new scope for each message to handle scoped dependencies
                using var messageScope = serviceScopeFactory.CreateScope();
                var processor = messageScope.ServiceProvider.GetRequiredService<PaymentMessageProcessor>();

                await processor.ProcessPolicyTerminated(message, cancellationToken);
            }
            catch (System.Exception ex)
            {
                logger.LogError(ex, "Failed to process PolicyTerminated event for policy number: {PolicyNumber}",
                    message.PolicyNumber);
                throw;
            }
        }, cancellationToken: stoppingToken);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}