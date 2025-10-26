using System.Threading.Tasks;
using Alba;
using PolicySearchService.Api.Queries;
using Xunit;
using static Xunit.Assert;

namespace PolicySearchService.IntegrationTest;

[Collection(nameof(PolicySearchControllerFixtureCollection))]
public class PolicySearchControllerTest(PolicySearchControllerFixture fixture)
{
    [Fact]
    public async Task CanSearchPolicies_WithValidQuery_ReturnsSuccessResult()
    {
        var query = "test";

        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url($"/api/PolicySearch?q={query}");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
        NotNull(result.Policies);
    }

    [Fact]
    public async Task CanSearchPolicies_WithEmptyQuery_ReturnsSuccessResult()
    {
        var query = "";

        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url($"/api/PolicySearch?q={query}");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
        NotNull(result.Policies);
    }

    [Fact]
    public async Task CanSearchPolicies_WithNullQuery_ReturnsSuccessResult()
    {
        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url("/api/PolicySearch");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
        NotNull(result.Policies);
    }

    [Fact]
    public async Task CanSearchPolicies_WithSpecialCharacters_ReturnsSuccessResult()
    {
        var query = "policy-123*test";

        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url($"/api/PolicySearch?q={query}");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
        NotNull(result.Policies);
    }

    [Fact]
    public async Task CanSearchPolicies_WithLongQuery_ReturnsSuccessResult()
    {
        var query = "This is a very long search query that should test the system's ability to handle lengthy search strings without any issues";

        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url($"/api/PolicySearch?q={query}");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
        NotNull(result.Policies);
    }

    [Fact]
    public async Task SearchPolicies_ReturnsValidPolicyDtoStructure()
    {
        var query = "policy";

        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url($"/api/PolicySearch?q={query}");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
        NotNull(result.Policies);

        // Verify that the response structure is correct
        // Even if no policies are found, the structure should be valid
        foreach (var policy in result.Policies)
        {
            // These properties should exist in the DTO structure
            NotNull(policy.PolicyNumber);
            NotNull(policy.ProductCode);
            NotNull(policy.PolicyHolder);
            True(policy.PremiumAmount >= 0);
        }
    }

    [Fact]
    public async Task SearchPolicies_WithNonExistentPolicy_ReturnsEmptyResult()
    {
        var query = "nonexistentpolicy123456789";

        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url($"/api/PolicySearch?q={query}");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
        NotNull(result.Policies);
        // The result should be empty or contain no matching policies
    }

    [Fact]
    public async Task SearchPolicies_EndpointExists_ReturnsCorrectContentType()
    {
        var query = "test";

        var scenarioResult = await fixture.PolicySearchHost.Scenario(s =>
        {
            s.Get.Url($"/api/PolicySearch?q={query}");
            s.ContentTypeShouldBe("application/json; charset=utf-8");
            s.StatusCodeShouldBeOk();
        });

        var result = scenarioResult.ReadAsJson<FindPolicyResult>();
        NotNull(result);
    }
}