using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PolicySearchService.Domain;
using PolicyService.Api.Events;

namespace PolicySearchService.Listeners;

public class PolicyCreatedHandler(IPolicyRepository policis) : INotificationHandler<PolicyCreated>
{
    public async Task Handle(PolicyCreated notification, CancellationToken cancellationToken)
    {
        await policis.Add(new Policy
        {
            PolicyNumber = notification.PolicyNumber,
            PolicyStartDate = notification.PolicyFrom,
            PolicyEndDate = notification.PolicyTo,
            ProductCode = notification.ProductCode,
            PolicyHolder = $"{notification.PolicyHolder.FirstName} {notification.PolicyHolder.LastName}",
            PremiumAmount = notification.TotalPremium
        });
    }
}