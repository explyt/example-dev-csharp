using Xunit;

namespace DashboardService.E2ETest;

/// <summary>
/// Collection definition to ensure tests run sequentially to avoid port conflicts
/// </summary>
[CollectionDefinition(nameof(DashboardServiceTestCollection), DisableParallelization = true)]
public class DashboardServiceTestCollection : ICollectionFixture<DashboardServiceFixture>
{
}
