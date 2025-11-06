using Xunit;

namespace PolicyService.IntegrationTest;

[CollectionDefinition(nameof(PolicyControllerCollection), DisableParallelization = true)]
public class PolicyControllerCollection : ICollectionFixture<PolicyControllerFixture>;