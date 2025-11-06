using Xunit;

namespace DashboardService.IntegrationTest;

[CollectionDefinition(nameof(DashboardControllerFixtureCollection), DisableParallelization = true)]
public class DashboardControllerFixtureCollection: ICollectionFixture<DashboardControllerFixture>;