using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace ChatService.Messaging.SignalR;

public class PolicyCreatedSubscriber : IHostedService
{
    private readonly HubConnection hubConnection;
    private readonly IMediator mediator;
    private readonly ILogger<PolicyCreatedSubscriber> logger;
    private readonly bool isEnabled;
    
    public PolicyCreatedSubscriber(
        IConfiguration configuration,
        IServiceProvider services,
        IMediator mediator,
        ILogger<PolicyCreatedSubscriber> logger)
    {
        this.mediator = mediator;
        this.logger = logger;
        this.isEnabled = configuration.GetSection("SignalRHub").GetValue<bool>("IsEnabled");
        
        if(!isEnabled) return;
        
        var signalRHubUrl = configuration["SignalRHub:Url"]!;
        var httpMessageHandler = services.GetService(typeof(HttpMessageHandler)) as HttpMessageHandler;
        hubConnection = new HubConnectionBuilder()
            .WithUrl(signalRHubUrl, o =>
            {
                if (httpMessageHandler != null) o.HttpMessageHandlerFactory = _ => httpMessageHandler;
            })
            .WithAutomaticReconnect()
            .Build();
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!isEnabled) return;
        
        hubConnection.On<PolicyCreated>("PolicyCreated", async policyCreated =>
        {
            logger.LogInformation("Received PolicyCreated event for policy {PolicyNumber}",
                policyCreated.PolicyNumber);
            await mediator.Publish(policyCreated, cancellationToken);
        });

        hubConnection.On<PolicyTerminated>("PolicyTerminated", async policyTerminated =>
        {
            logger.LogInformation("Received PolicyTerminated event for policy {PolicyNumber}",
                policyTerminated.PolicyNumber);
            await mediator.Publish(policyTerminated, cancellationToken);
        });
        const int maxRetries = 10;
        var retryDelays = new[] { 1, 2, 5, 10, 15, 30, 60 };

        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                await hubConnection.StartAsync(cancellationToken);
                logger.LogInformation("SignalR connection started successfully. State: {State}", hubConnection.State);
                return;
            }
            catch (Exception ex)
            {
                var delay = retryDelays[Math.Min(attempt, retryDelays.Length - 1)];
                logger.LogWarning(ex,
                    "SignalR connection attempt {Attempt}/{MaxRetries} failed. Retrying in {Delay}s...",
                    attempt + 1, maxRetries, delay);

                if (attempt < maxRetries - 1)
                {
                    await Task.Delay(TimeSpan.FromSeconds(delay), cancellationToken);
                }
            }
        }

        logger.LogError("Failed to establish SignalR connection after {MaxRetries} attempts", maxRetries);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (!isEnabled) return;
        
        logger.LogInformation("Stopping SignalR connection...");
        await hubConnection.StopAsync(cancellationToken);
        await hubConnection.DisposeAsync();
        logger.LogInformation("SignalR connection stopped");
    }
}