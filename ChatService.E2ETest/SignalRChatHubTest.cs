using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Alba;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Configuration;
using Xunit;
using Xunit.Abstractions;
using static Xunit.Assert;

namespace ChatService.E2ETest;

/// <summary>
/// Tests for SignalR AgentChatHub functionality
/// </summary>
[Collection("ChatService E2E")]
public class SignalRChatHubTest(ITestOutputHelper testOutputHelper) : IAsyncLifetime
{
    private IAlbaHost chatHost;
    private const string TestSecret = "THIS_IS_A_TEST_SECRET_KEY_FOR_JWT_TOKEN_GENERATION_MINIMUM_32_CHARS";

    public async Task InitializeAsync()
    {
        var chatBuilder = ChatService.Program.CreateWebHostBuilder([])
            .ConfigureAppConfiguration((_, config) =>
            {
                var overrides = new Dictionary<string, string>
                {
                    { "AppSettings:Secret", TestSecret },
                    { "AppSettings:AllowedChatOrigins:0", "http://localhost" }
                };
                config.AddInMemoryCollection(overrides);
            });

        chatHost = new AlbaHost(chatBuilder);
        await Task.Delay(500);
    }

    public async Task DisposeAsync()
    {
        if (chatHost != null) await chatHost.DisposeAsync();
    }

    /// <summary>
    /// Scenario: Agent sends message to chat
    /// Given: Two agents are connected to chat hub
    /// When: One agent sends a message
    /// Then: All connected clients should receive the message
    /// </summary>
    [Fact]
    public async Task AgentSendMessage_Should_BroadcastToAllClients()
    {
        const string agent1Login = "agent.one";
        const string agent1Avatar = "avatar1.png";
        const string agent2Login = "agent.two";
        const string testMessage = "Hello from agent one!";

        var agent1MessageReceived = false;
        var agent2MessageReceived = false;
        string agent2ReceivedUser = null;
        string agent2ReceivedAvatar = null;
        string agent2ReceivedMessage = null;

        var chatBaseUrl = chatHost.Server.BaseAddress.ToString().TrimEnd('/');

        // Connect agent 1
        var token1 = TestAuthHelper.GenerateJwtToken(agent1Login, agent1Avatar, TestSecret);
        var connection1 = new HubConnectionBuilder()
            .WithUrl($"{chatBaseUrl}/agentsChat", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token1);
                options.HttpMessageHandlerFactory = _ => chatHost.Server.CreateHandler();
            })
            .Build();

        connection1.On<string, string, string>("ReceiveMessage", (user, avatar, message) =>
        {
            testOutputHelper.WriteLine($"Agent1 received: {user} ({avatar}): {message}");
            agent1MessageReceived = true;
        });

        await connection1.StartAsync();
        True(connection1.State == HubConnectionState.Connected);

        // Connect agent 2
        var token2 = TestAuthHelper.GenerateJwtToken(agent2Login, "avatar2.png", TestSecret);
        var connection2 = new HubConnectionBuilder()
            .WithUrl($"{chatBaseUrl}/agentsChat", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token2);
                options.HttpMessageHandlerFactory = _ => chatHost.Server.CreateHandler();
            })
            .Build();

        connection2.On<string, string, string>("ReceiveMessage", (user, avatar, message) =>
        {
            testOutputHelper.WriteLine($"Agent2 received: {user} ({avatar}): {message}");
            agent2ReceivedUser = user;
            agent2ReceivedAvatar = avatar;
            agent2ReceivedMessage = message;
            agent2MessageReceived = true;
        });

        await connection2.StartAsync();
        True(connection2.State == HubConnectionState.Connected);

        await Task.Delay(500);

        // Agent 1 sends message
        await connection1.InvokeAsync("SendMessage", testMessage);

        // Wait for message propagation
        await Task.Delay(1000);

        // Verify both agents received the message
        True(agent1MessageReceived, "Agent 1 should receive their own message");
        True(agent2MessageReceived, "Agent 2 should receive the message");
        Equal(agent1Login, agent2ReceivedUser);
        Equal(agent1Avatar, agent2ReceivedAvatar);
        Equal(testMessage, agent2ReceivedMessage);

        testOutputHelper.WriteLine("Message broadcast test completed successfully");

        await connection1.StopAsync();
        await connection2.StopAsync();
        await connection1.DisposeAsync();
        await connection2.DisposeAsync();
    }

    /// <summary>
    /// Scenario: Agent connection notifications
    /// Given: One agent is connected to chat
    /// When: Another agent joins
    /// Then: First agent should receive join notification
    /// </summary>
    [Fact]
    public async Task AgentConnection_Should_NotifyOtherClients()
    {
        const string agent1Login = "agent.first";
        const string agent2Login = "agent.second";

        var joinNotificationReceived = false;
        string receivedNotification = null;

        var chatBaseUrl = chatHost.Server.BaseAddress.ToString().TrimEnd('/');

        // Connect agent 1
        var token1 = TestAuthHelper.GenerateJwtToken(agent1Login, "avatar1.png", TestSecret);
        var connection1 = new HubConnectionBuilder()
            .WithUrl($"{chatBaseUrl}/agentsChat", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token1);
                options.HttpMessageHandlerFactory = _ => chatHost.Server.CreateHandler();
            })
            .Build();

        connection1.On<string>("ReceiveNotification", notification =>
        {
            testOutputHelper.WriteLine($"Notification received: {notification}");
            receivedNotification = notification;
            joinNotificationReceived = true;
        });

        await connection1.StartAsync();
        True(connection1.State == HubConnectionState.Connected);

        await Task.Delay(500);

        // Connect agent 2
        var token2 = TestAuthHelper.GenerateJwtToken(agent2Login, "avatar2.png", TestSecret);
        var connection2 = new HubConnectionBuilder()
            .WithUrl($"{chatBaseUrl}/agentsChat", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult(token2);
                options.HttpMessageHandlerFactory = _ => chatHost.Server.CreateHandler();
            })
            .Build();

        await connection2.StartAsync();
        True(connection2.State == HubConnectionState.Connected);

        // Wait for notification
        await Task.Delay(1000);

        // Verify notification was received
        True(joinNotificationReceived, "Join notification should be received");
        NotNull(receivedNotification);
        Contains(agent2Login, receivedNotification);
        Contains("join", receivedNotification.ToLower());

        testOutputHelper.WriteLine("Connection notification test completed successfully");

        await connection1.StopAsync();
        await connection2.StopAsync();
        await connection1.DisposeAsync();
        await connection2.DisposeAsync();
    }

    /// <summary>
    /// Scenario: Unauthorized access
    /// Given: User attempts to connect without valid JWT token
    /// When: Connection is attempted
    /// Then: Connection should fail
    /// </summary>
    [Fact]
    public async Task UnauthorizedConnection_Should_Fail()
    {
        var chatBaseUrl = chatHost.Server.BaseAddress.ToString().TrimEnd('/');

        var connection = new HubConnectionBuilder()
            .WithUrl($"{chatBaseUrl}/agentsChat", options =>
            {
                options.AccessTokenProvider = () => Task.FromResult<string>(null);
                options.HttpMessageHandlerFactory = _ => chatHost.Server.CreateHandler();
            })
            .Build();
        
        // Attempt to connect without token should fail
        await ThrowsAsync<HttpRequestException>(async () => await connection.StartAsync());

        testOutputHelper.WriteLine("Unauthorized connection test completed successfully");
    }
}
