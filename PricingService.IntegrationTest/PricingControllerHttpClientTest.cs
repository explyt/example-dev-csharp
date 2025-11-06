using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PricingService.Api.Commands;
using PricingService.Api.Commands.Dto;
using Xunit;

namespace PricingService.IntegrationTest;

public class PricingControllerHttpClientTest : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public PricingControllerHttpClientTest(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task PriceForTravelPolicyIsCorrect()
    {
        // Arrange
        var command = new CalculatePriceCommand
        {
            ProductCode = "TRI",
            PolicyFrom = DateTimeOffset.Now.AddDays(5),
            PolicyTo = DateTimeOffset.Now.AddDays(10),
            SelectedCovers = new List<string> { "C1", "C2", "C3" },
            Answers = new List<QuestionAnswer>
            {
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_CHILDREN", Answer = 1M },
                new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
            }
        };

        // Verify the client is properly configured
        Assert.NotNull(_client.BaseAddress);
        Assert.StartsWith("http", _client.BaseAddress.ToString());

        // Act
        var json = JsonConvert.SerializeObject(command);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _client.PostAsync("/api/Pricing", content);

        // Assert
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var calculationResult = JsonConvert.DeserializeObject<CalculatePriceResult>(responseJson);
        Assert.NotNull(calculationResult);
        Assert.Equal(98M, calculationResult.TotalPrice);
    }

    [Fact]
    public async Task ServerIsRunning()
    {
        // Act
        var response = await _client.GetAsync("/");

        // Assert
        Assert.True(response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CommandIsProperlyValidated()
    {
        // Arrange
        var invalidCommand = new CalculatePriceCommand();

        // Act
        var json = JsonConvert.SerializeObject(invalidCommand);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _client.PostAsync("/api/Pricing", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task InvalidProductCodeReturnsBadRequest()
    {
        // Arrange
        var command = new CalculatePriceCommand
        {
            ProductCode = "INVALID",
            PolicyFrom = DateTimeOffset.Now.AddDays(5),
            PolicyTo = DateTimeOffset.Now.AddDays(10),
            SelectedCovers = new List<string> { "C1" },
            Answers = new List<QuestionAnswer>()
        };

        // Act
        var json = JsonConvert.SerializeObject(command);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _client.PostAsync("/api/Pricing", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }
}