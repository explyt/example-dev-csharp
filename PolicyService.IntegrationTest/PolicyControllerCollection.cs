using Xunit;

namespace PolicyService.IntegrationTest;

[CollectionDefinition(nameof(PolicyControllerCollection))]
public class PolicyControllerCollection : ICollectionFixture<PolicyControllerFixture>;