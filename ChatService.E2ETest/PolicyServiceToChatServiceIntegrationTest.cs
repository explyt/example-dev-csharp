using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Alba;
using ChatService.Api.Commands;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PolicyService.Api.Commands;
using PolicyService.Api.Commands.Dtos;
using TestHelpers;
using Xunit;
using Xunit.Abstractions;
using static Xunit.Assert;

namespace ChatService.E2ETest;

/// <summary>
/// End-to-end integration test that spans PolicyService, PricingService, and ChatService
/// Tests the complete flow: policy creation -> event publishing -> chat notification
/// </summary>
[Collection(nameof(ChatServiceTestCollection))]
public class PolicyServiceToChatServiceIntegrationTest(ITestOutputHelper testOutputHelper) : IAsyncLifetime
{
    private IAlbaHost policyHost;
    private IAlbaHost pricingHost;
    private IAlbaHost chatHost;
    private const string TestSecret = "THIS_IS_A_TEST_SECRET_KEY_FOR_JWT_TOKEN_GENERATION_MINIMUM_32_CHARS";

    public async Task InitializeAsync()
    {
        // Get a random available port for MessagePipe to avoid conflicts with parallel tests
        var messagePipePort = PortHelper.GetAvailablePort();
        testOutputHelper.WriteLine($"Using MessagePipe port: {messagePipePort}");

        // Start Pricing Service
        var pricingBuilder = PricingService.Program.CreateWebHostBuilder([]);
        pricingHost = new AlbaHost(pricingBuilder);

        var pricingBase = pricingHost.Server.BaseAddress.ToString().TrimEnd('/');
        var pricingEndpoint = $"{pricingBase}/api/pricing";

        // Start Policy Service with Pricing Service dependency
        var policyBuilder = PolicyService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "PricingServiceUri", pricingEndpoint },
                    { "MessagePipe:Port", messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            })
            .ConfigureServices((ctx, services) =>
            {
                services.AddSingleton(_ =>
                {
                    var http = pricingHost.Server.CreateClient();
                    http.BaseAddress = new Uri(pricingEndpoint);
                    return RestEase.RestClient.For<PolicyService.RestClients.IPricingClient>(http);
                });
            });

        policyHost = new AlbaHost(policyBuilder);

        // Start Chat Service with test configuration
        var chatBuilder = ChatService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "AppSettings:Secret", TestSecret },
                    { "AppSettings:AllowedChatOrigins:0", "http://localhost" },
                    { "MessagePipe:Port", messagePipePort.ToString() }
                };
                config.AddInMemoryCollection(overrides);
            });

        chatHost = new AlbaHost(chatBuilder);

        // Give services time to fully initialize, especially MessagePipe endpoints
        await Task.Delay(2000);
    }

    public async Task DisposeAsync()
    {
        if (policyHost != null) await policyHost.DisposeAsync();
        if (pricingHost != null) await pricingHost.DisposeAsync();
        if (chatHost != null) await chatHost.DisposeAsync();
    }

    /// <summary>
    /// Scenario: Policy creation triggers chat notification
    /// Given: Agent creates a travel insurance policy
    /// When: Policy is created successfully
    /// Then: Chat notification should be broadcast to all connected clients
    /// </summary>
    [Fact]
    public async Task PolicyCreation_Should_BroadcastChatNotification()
    {
        const string agentLogin = "jimmy.solid";
        var notificationReceived = false;
        string receivedNotification = null;

        // Step 1: Connect to SignalR hub
        var token = TestAuthHelper.GenerateJwtToken(agentLogin, "avatar1.png", TestSecret);
        var chatBaseUrl = chatHost.Server.BaseAddress.ToString().TrimEnd('/');
        
        var connection = new HubConnectionBuilder()
            .WithUrl($"{chatBaseUrl}/agentsChat", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token);
                options.HttpMessageHandlerFactory = _ => chatHost.Server.CreateHandler();
            })
            .Build();

        connection.On<string>("ReceiveNotification", notification =>
        {
            testOutputHelper.WriteLine($"Received notification: {notification}");
            receivedNotification = notification;
            notificationReceived = true;
        });

        await connection.StartAsync();
        True(connection.State == HubConnectionState.Connected, "SignalR connection should be established");

        // Step 2: Create an offer
        var createOfferCommand = new CreateOfferCommand
        {
            ProductCode = "TRI",
            PolicyFrom = DateTime.Now.AddDays(5),
            PolicyTo = DateTime.Now.AddDays(10),
            SelectedCovers = new List<string> { "C1", "C2", "C3" },
            Answers = new List<QuestionAnswer>
            {
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_CHILDREN", Answer = 1M },
                new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
            }
        };

        var offerScenario = await policyHost.Scenario(scenario =>
        {
            scenario.Post.Json(createOfferCommand).ToUrl("/api/Offer");
            scenario.WithRequestHeader("AgentLogin", agentLogin);
            scenario.StatusCodeShouldBeOk();
        });

        var createOfferResult = await offerScenario.ReadAsJsonAsync<CreateOfferResult>();
        NotNull(createOfferResult);
        NotNull(createOfferResult.OfferNumber);

        // Step 3: Create a policy using the offer
        var createPolicyCommand = new CreatePolicyCommand
        {
            OfferNumber = createOfferResult.OfferNumber,
            PolicyHolder = new PersonDto
            {
                FirstName = "John",
                LastName = "Doe",
                TaxId = "123456789"
            },
            PolicyHolderAddress = new AddressDto
            {
                Country = "PL",
                ZipCode = "00-001",
                City = "Warsaw",
                Street = "Main Street 123"
            }
        };

        var policyScenario = await policyHost.Scenario(scenario =>
        {
            scenario.Post.Json(createPolicyCommand).ToUrl("/api/Policy");
            scenario.StatusCodeShouldBeOk();
        });

        var createPolicyResult = await policyScenario.ReadAsJsonAsync<CreatePolicyResult>();
        NotNull(createPolicyResult);
        NotNull(createPolicyResult.PolicyNumber);

        // Step 4: Wait for event processing and notification
        var maxAttempts = 10;
        var delayMs = 500;

        for (int attempt = 0; attempt < maxAttempts && !notificationReceived; attempt++)
        {
            await Task.Delay(delayMs);
        }

        // Step 5: Verify notification was received
        True(notificationReceived, "Chat notification should be received");
        NotNull(receivedNotification);
        Contains(agentLogin, receivedNotification);
        Contains("TRI", receivedNotification);
        Contains("sold policy", receivedNotification.ToLower());

        testOutputHelper.WriteLine($"Test completed successfully. Notification: {receivedNotification}");

        await connection.StopAsync();
        await connection.DisposeAsync();
    }

    /// <summary>
    /// Scenario: REST API notification endpoint
    /// Given: Authenticated user sends notification via REST API
    /// When: Notification is posted to /api/Notification
    /// Then: Notification should be broadcast to all connected SignalR clients
    /// </summary>
    [Fact]
    public async Task RestApiNotification_Should_BroadcastToSignalRClients()
    {
        const string agentLogin = "test.agent";
        const string testMessage = "Test notification message";
        var notificationReceived = false;
        string receivedMessage = null;
        string receivedSender = null;

        // Step 1: Connect to SignalR hub
        var token = TestAuthHelper.GenerateJwtToken(agentLogin, "avatar2.png", TestSecret);
        var chatBaseUrl = chatHost.Server.BaseAddress.ToString().TrimEnd('/');
        
        var connection = new HubConnectionBuilder()
            .WithUrl($"{chatBaseUrl}/agentsChat", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token);
                options.HttpMessageHandlerFactory = _ => chatHost.Server.CreateHandler();
            })
            .Build();

        connection.On<string, string>("ReceiveMessage", (sender, message) =>
        {
            testOutputHelper.WriteLine($"Received message from {sender}: {message}");
            receivedSender = sender;
            receivedMessage = message;
            notificationReceived = true;
        });

        await connection.StartAsync();
        True(connection.State == HubConnectionState.Connected);

        // Step 2: Send notification via REST API
        var sendNotificationCommand = new SendNotificationCommand
        {
            Message = testMessage
        };

        var notificationScenario = await chatHost.Scenario(scenario =>
        {
            scenario.Post.Json(sendNotificationCommand).ToUrl("/api/Notification");
            scenario.WithRequestHeader("Authorization", $"Bearer {token}");
            scenario.StatusCodeShouldBeOk();
        });

        // Step 3: Wait for notification
        await Task.Delay(1000);

        // Step 4: Verify notification was received
        True(notificationReceived, "Notification should be received via SignalR");
        Equal("system", receivedSender);
        Equal(testMessage, receivedMessage);

        testOutputHelper.WriteLine("REST API notification test completed successfully");

        await connection.StopAsync();
        await connection.DisposeAsync();
    }
}
