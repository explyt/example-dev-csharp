using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Polly;
using Polly.Retry;
using PricingService.Api.Commands;
using RestEase;

namespace PolicyService.RestClients;

public interface IPricingClient
{
    [Post]
    Task<CalculatePriceResult> CalculatePrice([Body] CalculatePriceCommand cmd);
}

public class PricingClient : IPricingClient
{
    private static readonly AsyncRetryPolicy retryPolicy = Policy
        .Handle<HttpRequestException>()
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(3));

    private readonly IPricingClient client;

    public PricingClient(IConfiguration configuration)
    {
        var pricingUri = configuration.GetValue<string>("PricingServiceUri");
        var httpClient = new HttpClient()
        {
            BaseAddress = new Uri(pricingUri)
        };
        client = RestClient.For<IPricingClient>(httpClient);
    }

    public Task<CalculatePriceResult> CalculatePrice([Body] CalculatePriceCommand cmd)
    {
        return retryPolicy.ExecuteAsync(async () => await client.CalculatePrice(cmd));
    }
}
