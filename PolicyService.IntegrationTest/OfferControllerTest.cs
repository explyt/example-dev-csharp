using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PolicyService.Api.Commands;
using PolicyService.Api.Commands.Dtos;
using Xunit;
using static Xunit.Assert;

namespace PolicyService.IntegrationTest;

[Collection(nameof(PolicyControllerCollection))]
public class OfferControllerTest(PolicyControllerFixture fixture)
{
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
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_CHILDREN", Answer = 1M },
                new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
            }
        };

        var scenarioResult = await fixture.PolicyHost.Scenario(s => { s.Post.Json(command).ToUrl("/api/Offer"); });

        var result = scenarioResult.ReadAsJson<CreateOfferResult>();
        NotNull(result);
        NotNull(result.OfferNumber);
        True(result.TotalPrice > 0);
    }

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
                new TextQuestionAnswer { QuestionCode = "TYP", Answer = "APT" },
                new TextQuestionAnswer { QuestionCode = "FLOOD", Answer = "YES" },
                new NumericQuestionAnswer { QuestionCode = "NUM_OF_CLAIM", Answer = 2M },
                new NumericQuestionAnswer { QuestionCode = "AREA", Answer = 20M },
            }
        };

        var scenarioResult = await fixture.PolicyHost.Scenario(s =>
        {
            s.Post.Json(command).ToUrl("/api/Offer");
            s.WithRequestHeader("AgentLogin", agentLogin);
        });

        var result = scenarioResult.ReadAsJson<CreateOfferResult>();
        NotNull(result);
        NotNull(result.OfferNumber);
        True(result.TotalPrice > 0);
    }
}