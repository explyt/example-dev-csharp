using Xunit;

namespace PricingService.IntegrationTest;

[CollectionDefinition(nameof(PricingControllerFixtureCollection))]
public class PricingControllerFixtureCollection : ICollectionFixture<PricingControllerFixture>
{
}