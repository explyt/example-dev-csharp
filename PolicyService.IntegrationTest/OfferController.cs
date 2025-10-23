using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PolicyService.Api.Commands;
using PolicyService.Api.Commands.Dtos;
using Xunit;
using static Xunit.Assert;

namespace PolicyService.IntegrationTest;

public class OfferController : IClassFixture<PolicyControllerWithRealPricingFixture>
{
    private readonly PolicyControllerWithRealPricingFixture fixture;

    public OfferController(PolicyControllerWithRealPricingFixture fixture)
    {
        this.fixture = fixture;
    }

    /// <summary>
    /// Scenario: Customer creates offer using real PricingService
    /// Given: Customer provides parameters for insurance product
    /// When: Customer submits create offer request
    /// Then: System returns valid offer with pricing from real PricingService
    /// </summary>
    [Fact]
    public async Task CanCreateOfferWithRealPricingService()
    {
        var command = new CreateOfferCommand
        {
            ProductCode = "TRI",
            PolicyFrom = DateTime.Now.AddDays(5),
            PolicyTo = DateTime.Now.AddDays(10),
            SelectedCovers = new List<string> { "C1", "C2" },
            Answers = new List<QuestionAnswer>
            {
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
                new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
            }
        };
        
        var json = JsonConvert.SerializeObject(command);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await fixture.PolicyClient.PostAsJsonAsync("/api/Offer", content);
        
        Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        
        var createOfferResult = await response.Content.ReadFromJsonAsync<CreateOfferResult>();
        NotNull(createOfferResult);
        NotNull(createOfferResult.OfferNumber);
        True(createOfferResult.TotalPrice > 0);
    }

    /// <summary>
    /// Scenario: Agent creates offer using real PricingService
    /// Given: Agent provides parameters for insurance product
    /// When: Agent submits create offer request with agent header
    /// Then: System returns valid offer with pricing from real PricingService
    /// </summary>
    [Fact]
    public async Task AgentCanCreateOfferWithRealPricingService()
    {
        var agentLogin = "jimmy.solid";
        var command = new CreateOfferCommand
        {
            ProductCode = "HSI",
            PolicyFrom = DateTime.Now.AddDays(15),
            PolicyTo = DateTime.Now.AddDays(30),
            SelectedCovers = new List<string> { "C1", "C2" },
            Answers = new List<QuestionAnswer>
            {
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 2M },
                new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "WORLD" }
            }
        };
        
        var json = JsonConvert.SerializeObject(command);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/Offer")
        {
            Content = content
        };
        request.Headers.Add("AgentLogin", agentLogin);

        var response = await fixture.PolicyClient.SendAsync(request);
        
        Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        
        var offerResult = await response.Content.ReadFromJsonAsync<CreateOfferResult>();
        NotNull(offerResult);
        NotNull(offerResult.OfferNumber);
        True(offerResult.TotalPrice > 0);
    }
}
