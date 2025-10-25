using Xunit;

namespace DashboardService.IntegrationTest;

[CollectionDefinition(nameof(DashboardControllerFixtureCollection))]
public class DashboardControllerFixtureCollection: ICollectionFixture<DashboardControllerFixture>;