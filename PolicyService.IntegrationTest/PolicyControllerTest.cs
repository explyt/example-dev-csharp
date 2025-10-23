// using System;
// using System.Collections.Generic;
// using System.Net;
// using System.Net.Http;
// using System.Net.Http.Json;
// using System.Threading.Tasks;
// using PolicyService.Api.Commands;
// using PolicyService.Api.Commands.Dtos;
// using PolicyService.Api.Queries;
// using Xunit;
// using static Xunit.Assert;
//
// namespace PolicyService.IntegrationTest;
//
// [Collection(nameof(PolicyControllerWithRealPricingCollection))]
// public class PolicyControllдerTest
// {
//     private readonly PolicyControllerWithRealPricingFixture fixture;
//
//     public PolicyControllerTest(PolicyControllerWithRealPricingFixture fixture)
//     {
//         this.fixture = fixture;
//     }
//
//     /// <summary>
//     /// Scenario: Customer creates an offer for travel insurance
//     /// Given: Customer provides valid travel insurance parameters
//     /// When: Customer submits create offer request
//     /// Then: System returns valid offer with calculated price
//     /// </summary>
//     [Fact]
//     public async Task CanCreateOfferForTravelInsurance()
//     {
//         var command = new CreateOfferCommand
//         {
//             ProductCode = "TRI",
//             PolicyFrom = DateTime.Now.AddDays(5),
//             PolicyTo = DateTime.Now.AddDays(10),
//             SelectedCovers = new List<string> { "C1", "C2", "C3" },
//             Answers = new List<QuestionAnswer>
//             {
//                 new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
//                 new NumericQuestionAnswer { QuestionCode = "NUM_OF_CHILDREN", Answer = 1M },
//                 new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
//             }
//         };
//
//         var response = await fixture.PolicyServiceClient.PostAsJsonAsync("/api/Offer", command);
//         
//         Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
//         
//         var createOfferResult = await response.Content.ReadFromJsonAsync<CreateOfferResult>();
//         NotNull(createOfferResult);
//         NotNull(createOfferResult.OfferNumber);
//         True(createOfferResult.TotalPrice > 0);
//     }
//
//     /// <summary>
//     /// Scenario: Agent creates an offer on behalf of customer
//     /// Given: Agent provides valid insurance parameters and agent login
//     /// When: Agent submits create offer request with agent header
//     /// Then: System returns valid offer associated with the agent
//     /// </summary>
//     [Fact]
//     public async Task CanCreateOfferByAgent()
//     {
//         var command = new CreateOfferCommand
//         {
//             ProductCode = "TRI",
//             PolicyFrom = DateTime.Now.AddDays(5),
//             PolicyTo = DateTime.Now.AddDays(10),
//             SelectedCovers = new List<string> { "C1", "C2" },
//             Answers = new List<QuestionAnswer>
//             {
//                 new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 2M },
//                 new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "WORLD" }
//             }
//         };
//
//         var request = new HttpRequestMessage(HttpMethod.Post, "/api/Offer")
//         {
//             Content = JsonContent.Create(command)
//         };
//         request.Headers.Add("AgentLogin", "jimmy.son");
//
//         var response = await fixture.PolicyServiceClient.SendAsync(request);
//         
//         Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
//         
//         var createOfferResult = await response.Content.ReadFromJsonAsync<CreateOfferResult>();
//         NotNull(createOfferResult);
//         NotNull(createOfferResult.OfferNumber);
//         True(createOfferResult.TotalPrice > 0);
//     }
//
//     /// <summary>
//     /// Scenario: Customer purchases policy from valid offer
//     /// Given: Customer has a valid offer number and provides personal details
//     /// When: Customer submits create policy request
//     /// Then: System creates policy and returns policy number
//     /// </summary>
//     [Fact]
//     public async Task CanCreatePolicyFromValidOffer()
//     {
//         // First create an offer
//         var offerResponse = await fixture.SystemUnderTest.Scenario(_ =>
//         {
//             _.Post
//                 .Json(new CreateOfferCommand
//                 {
//                     ProductCode = "TRI",
//                     PolicyFrom = DateTime.Now.AddDays(5),
//                     PolicyTo = DateTime.Now.AddDays(10),
//                     SelectedCovers = new List<string> { "C1" },
//                     Answers = new List<QuestionAnswer>
//                     {
//                         new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
//                         new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
//                     }
//                 })
//                 .ToUrl("/api/Offer");
//             _.StatusCodeShouldBeOk();
//         });
//
//         var offerResult = await offerResponse.ReadAsJsonAsync<CreateOfferResult>();
//         
//         // Then create policy from the offer
//         var policyResponse = await fixture.SystemUnderTest.Scenario(_ =>
//         {
//             _.Post
//                 .Json(new CreatePolicyCommand
//                 {
//                     OfferNumber = offerResult.OfferNumber,
//                     PolicyHolder = new PersonDto
//                     {
//                         FirstName = "John",
//                         LastName = "Doe",
//                         TaxId = "123456789"
//                     },
//                     PolicyHolderAddress = new AddressDto
//                     {
//                         Country = "PL",
//                         ZipCode = "00-001",
//                         City = "Warsaw",
//                         Street = "Main St 123"
//                     }
//                 })
//                 .ToUrl("/api/Policy");
//             _.StatusCodeShouldBeOk();
//         });
//
//         var policyResult = await policyResponse.ReadAsJsonAsync<CreatePolicyResult>();
//         NotNull(policyResult);
//         NotNull(policyResult.PolicyNumber);
//     }
//     //
//     // /// <summary>
//     // /// Scenario: Customer retrieves policy details
//     // /// Given: Customer has a valid policy number
//     // /// When: Customer requests policy details
//     // /// Then: System returns policy information
//     // /// </summary>
//     // [Fact]
//     // public async Task CanGetPolicyDetails()
//     // {
//     //     // First create an offer and policy
//     //     var offerResponse = await fixture.SystemUnderTest.Scenario(_ =>
//     //     {
//     //         _.Post
//     //             .Json(new CreateOfferCommand
//     //             {
//     //                 ProductCode = "TRI",
//     //                 PolicyFrom = DateTime.Now.AddDays(5),
//     //                 PolicyTo = DateTime.Now.AddDays(10),
//     //                 SelectedCovers = new List<string> { "C1" },
//     //                 Answers = new List<QuestionAnswer>
//     //                 {
//     //                     new NumericQuestionAnswer { QuestionCode = "NUM_OF_ADULTS", Answer = 1M },
//     //                     new TextQuestionAnswer { QuestionCode = "DESTINATION", Answer = "EUR" }
//     //                 }
//     //             })
//     //             .ToUrl("/api/Offer");
//     //         _.StatusCodeShouldBeOk();
//     //     });
//     //
//     //     var offerResult = await offerResponse.ReadAsJsonAsync<CreateOfferResult>();
//     //     
//     //     var policyResponse = await fixture.SystemUnderTest.Scenario(_ =>
//     //     {
//     //         _.Post
//     //             .Json(new CreatePolicyCommand
//     //             {
//     //                 OfferNumber = offerResult.OfferNumber,
//     //                 PolicyHolder = new PersonDto
//     //                 {
//     //                     FirstName = "Jane",
//     //                     LastName = "Smith",
//     //                     TaxId = "987654321"
//     //                 },
//     //                 PolicyHolderAddress = new AddressDto
//     //                 {
//     //                     Country = "PL",
//     //                     ZipCode = "00-002",
//     //                     City = "Krakow",
//     //                     Street = "Second St 456"
//     //                 }
//     //             })
//     //             .ToUrl("/api/Policy");
//     //         _.StatusCodeShouldBeOk();
//     //     });
//     //
//     //     var policyResult = await policyResponse.ReadAsJsonAsync<CreatePolicyResult>();
//     //     
//     //     // Then get policy details
//     //     var detailsResponse = await fixture.SystemUnderTest.Scenario(_ =>
//     //     {
//     //         _.Get
//     //             .ToUrl($"/api/Policy/{policyResult.PolicyNumber}");
//     //         _.StatusCodeShouldBeOk();
//     //     });
//     //
//     //     var policyDetails = await detailsResponse.ReadAsJsonAsync<GetPolicyDetailsQueryResult>();
//     //     NotNull(policyDetails);
//     //     NotNull(policyDetails.Policy);
//     //     Equal(policyResult.PolicyNumber, policyDetails.Policy.Number);
//     // }
//
//     /// <summary>
//     /// Scenario: System validates invalid create offer request
//     /// Given: Customer provides invalid insurance parameters
//     /// When: Customer submits create offer request
//     /// Then: System returns validation error
//     /// </summary>
//     [Fact]
//     public async Task CreateOfferCommandIsProperlyValidated()
//     {
//         _ = await fixture.SystemUnderTest.Scenario(_ =>
//         {
//             _.Post
//                 .Json(new CreateOfferCommand())
//                 .ToUrl("/api/Offer");
//
//             _.StatusCodeShouldBe(HttpStatusCode.BadRequest);
//         });
//     }
//
//     /// <summary>
//     /// Scenario: System validates invalid create policy request
//     /// Given: Customer provides invalid policy creation parameters
//     /// When: Customer submits create policy request
//     /// Then: System returns validation error
//     /// </summary>
//     [Fact]
//     public async Task CreatePolicyCommandIsProperlyValidated()
//     {
//         _ = await fixture.SystemUnderTest.Scenario(_ =>
//         {
//             _.Post
//                 .Json(new CreatePolicyCommand())
//                 .ToUrl("/api/Policy");
//
//             _.StatusCodeShouldBe(HttpStatusCode.BadRequest);
//         });
//     }
// }