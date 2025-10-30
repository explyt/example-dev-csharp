using System.Threading;
using System.Threading.Tasks;
using MessagePipe;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PaymentService.Messaging.MessagePipe;

public class PolicyEventHandler(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<PolicyEventHandler> logger
    ) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = serviceScopeFactory.CreateScope();
        
        var policyCreatedSubscriber = scope.ServiceProvider.GetRequiredService<IDistributedSubscriber<string, PolicyCreated>>();
        var policyTerminatedSubscriber = scope.ServiceProvider.GetRequiredService<IDistributedSubscriber<string, PolicyTerminated>>();
        
        // Subscribe to PolicyCreated events
        var createdTask = policyCreatedSubscriber.SubscribeAsync("PolicyCreated", async (message, cancellationToken) =>
        {
            try
            {
                // Create a new scope for each message to handle scoped dependencies
                using var messageScope = serviceScopeFactory.CreateScope();
                var processor = messageScope.ServiceProvider.GetRequiredService<PaymentMessageProcessor>();

                await processor.ProcessPolicyCreated(message, cancellationToken);
            }
            catch (System.Exception ex)
            {
                logger.LogError(ex, "Failed to process PolicyCreated event for policy number: {PolicyNumber}",
                    message.PolicyNumber);
                throw;
            }
        }, cancellationToken: stoppingToken);
        
        // Subscribe to PolicyTerminated events
        var terminatedTask = policyTerminatedSubscriber.SubscribeAsync("PolicyTerminated", async (message, cancellationToken) =>
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
