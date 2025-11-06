using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Alba;
using ProductService.Api.Commands;
using ProductService.Api.Commands.Dtos;
using ProductService.Api.Queries.Dtos;
using Xunit;
using CoverDto = ProductService.Api.Commands.Dtos.CoverDto;
using NumericQuestionDto = ProductService.Api.Commands.Dtos.NumericQuestionDto;
using ChoiceQuestionDto = ProductService.Api.Commands.Dtos.ChoiceQuestionDto;
using ChoiceDto = ProductService.Api.Commands.Dtos.ChoiceDto;
using QuestionDto = ProductService.Api.Commands.Dtos.QuestionDto;

namespace ProductService.IntegrationTest;

[Collection(nameof(ProductControllerFixtureCollection))]
public class ProductsApiScenarios
{
    private readonly ProductControllerFixture fixture;

    public ProductsApiScenarios(ProductControllerFixture fixture)
    {
        this.fixture = fixture;
    }

    [Fact]
    public async Task Get_All_Products_Returns_Success()
    {

        // Act
        var result = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Get.Url("/api/products");
            _.StatusCodeShouldBeOk();
        });
        // Assert
        var response = await result.ReadAsJsonAsync<List<ProductDto>>();
        Assert.NotNull(response);
        Assert.NotEmpty(response);
    }

    [Fact]
    public async Task Get_Product_By_Code_Returns_Success()
    {
        // Arrange
        var productCode = "TRI"; // Assuming this product exists in demo data
    
        // Act
        var result = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Get.Url($"/api/products/{productCode}");
            _.StatusCodeShouldBeOk();
        });
    
        // Assert
        var response = await result.ReadAsJsonAsync<ProductDto>();
        Assert.NotNull(response);
        Assert.Equal(productCode, response.Code);
    }

    [Fact]
    public async Task Get_Product_By_Code_Returns_NotFound_For_Invalid_Code()
    {
        // Arrange
        var invalidProductCode = "INVALID_CODE";

        // Act & Assert
        var result = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Get.Url($"/api/products/{invalidProductCode}");
            _.StatusCodeShouldBe(HttpStatusCode.NotFound);
        });
    }

    [Fact]
    public async Task Create_Product_Draft_Returns_Success()
    {
        // Arrange
        var command = new CreateProductDraftCommand
        {
            ProductDraft = new ProductDraftDto
            {
                Code = "TEST_PRODUCT",
                Name = "Test Product",
                Image = "test.jpg",
                Description = "Test product description",
                Covers = new List<CoverDto>
                {
                    new()
                    {
                        Code = "COVER1",
                        Name = "Test Cover",
                        Description = "Test cover description",
                        Optional = false,
                        SumInsured = 1000
                    }
                },
                Questions = new List<QuestionDto>
                {
                    new NumericQuestionDto
                    {
                        QuestionCode = "QUESTION1",
                        Index = 1,
                        Text = "Test numeric question?",
                    },
                    new ChoiceQuestionDto
                    {
                        QuestionCode = "QUESTION2",
                        Index = 2,
                        Text = "Test choice question?",
                        Choices = new List<ChoiceDto>
                        {
                            new()
                            {
                                Code = "CHOICE_TEST_1",
                                Label = "Choice 1"
                            },
                            new()
                            {
                                Code = "CHOICE_TEST_2", 
                                Label = "Choice 2"
                            }
                        }
                    }
                }
            }
        };
    
        // Act
        var result = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Post.Json(command).ToUrl("/api/products");
            _.StatusCodeShouldBeOk();
        });
    
        // Assert
        var response = await result.ReadAsJsonAsync<CreateProductDraftResult>();
        Assert.NotNull(response);
        Assert.NotEqual(Guid.Empty, response.ProductId);
    }

    [Fact]
    public async Task Activate_Product_Returns_Success()
    {
        // First create a product draft
        var createCommand = new CreateProductDraftCommand
        {
            ProductDraft = new ProductDraftDto
            {
                Code = "ACTIVATE_TEST",
                Name = "Activate Test Product",
                Image = "activate.jpg",
                Description = "Product for activation test",
                Covers = new List<CoverDto>
                {
                    new()
                    {
                        Code = "COVER_ACT",
                        Name = "Activation Cover",
                        Description = "Cover for activation test",
                        Optional = false,
                        SumInsured = 2000
                    }
                },
                Questions = new List<QuestionDto>
                {
                    new NumericQuestionDto
                    {
                        QuestionCode = "QUESTION1",
                        Index = 1,
                        Text = "Test question?",
                    }
                }
            }
        };

        var createResult = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Post.Json(createCommand).ToUrl("/api/products");
            _.StatusCodeShouldBeOk();
        });

        var createResponse = await createResult.ReadAsJsonAsync<CreateProductDraftResult>();
        var productId = createResponse.ProductId;

        // Act - activate the product
        var activateCommand = new ActivateProductCommand
        {
            ProductId = productId
        };

        var activateResult = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Post.Json(activateCommand).ToUrl("/api/products/activate");
            _.StatusCodeShouldBeOk();
        });

        // Assert
        var activateResponse = await activateResult.ReadAsJsonAsync<ActivateProductResult>();
        Assert.NotNull(activateResponse);
        Assert.NotEqual(Guid.Empty, activateResponse.ProductId);
    }

    [Fact]
    public async Task Activate_Product_Returns_BadRequest_For_Invalid_ProductId()
    {
        // Arrange
        var activateCommand = new ActivateProductCommand
        {
            ProductId = Guid.NewGuid() // Non-existent product ID
        };

        // Act & Assert
        var result = await fixture.SystemUnderTest.Scenario(_ =>
        {
            _.Post.Json(activateCommand).ToUrl("/api/products/activate");
            _.StatusCodeShouldBe(HttpStatusCode.NotFound);
        });
    }
}