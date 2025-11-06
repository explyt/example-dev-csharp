using Xunit;

namespace ProductService.IntegrationTest;

[CollectionDefinition("ProductControllerFixtureCollection")]
public class ProductControllerFixtureCollection : ICollectionFixture<ProductControllerFixture>
{
}