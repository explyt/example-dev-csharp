using System;
using System.Threading.Tasks;
using Alba;
using ProductService.Api.Commands;
using Xunit;

namespace ProductService.IntegrationTest;

[Collection(nameof(ProductControllerFixtureCollection))]
public class DebugActivateTest
{
    private readonly ProductControllerFixture fixture;

    public DebugActivateTest(ProductControllerFixture fixture)
    {
        this.fixture = fixture;
    }

    [Fact]
    public async Task Debug_Activate_Invalid_ProductId()
    {
        // Arrange
        var activateCommand = new ActivateProductCommand
        {
            ProductId = Guid.NewGuid() // Non-existent product ID
        };

        // Act & Assert - Let's see what actually happens
        var result = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Post.Json(activateCommand).ToUrl("/api/products/activate");
            // Don't check status code, just get the response
        });
        
        // Check what status code was returned
        var statusCode = result.Context.Response.StatusCode;
        throw new Exception($"Status Code: {statusCode}");
    }

    [Fact]
    public async Task Debug_Check_Available_Endpoints()
    {
        // Test different endpoint variations
        
        // Test the base products endpoint
        await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Get.Url("/api/products");
            _.StatusCodeShouldBeOk();
        });

        // Test activate endpoint with different variations
        var activateCommand = new ActivateProductCommand
        {
            ProductId = Guid.NewGuid()
        };

        // Try different URL variations
        var variations = new[]
        {
            "/api/products/activate",
            "/api/Products/activate",
            "/products/activate",
            "/activate"
        };

        foreach (var url in variations)
        {
            try
            {
                var response = await fixture.SystemUnderTest.Scenario(_ =>
                {
                    _.Post.Json(activateCommand).ToUrl(url);
                    // Don't check status code, just get the response
                });
                throw new Exception($"URL: {url} - Status Code: {response.Context.Response.StatusCode}");
            }
            catch (Exception ex)
            {
                throw new Exception($"URL: {url} - Error: {ex.Message}");
            }
        }
    }
}