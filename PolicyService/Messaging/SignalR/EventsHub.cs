using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using PolicyService.Api.Events;

namespace PolicyService.Messaging.SignalR;

public class EventsHub(ILogger<EventsHub> logger) : Hub
{
    public const string PolicyCreatedMethod = "PolicyCreated";
    public const string PolicyTerminatedMethod = "PolicyTerminated";
    
    public async Task SendPolicyCreated(PolicyCreated policyCreatedEvent)
    {
        await Clients.All.SendAsync(PolicyCreatedMethod, policyCreatedEvent);
    }
    
    public async Task SendPolicyTerminated(PolicyTerminated policyTerminatedEvent)
    {
        await Clients.All.SendAsync(PolicyTerminatedMethod, policyTerminatedEvent);
    }
}
