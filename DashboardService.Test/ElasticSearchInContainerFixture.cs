using System.Threading.Tasks;
using DashboardService.DataAccess.InMemory;
using DashboardService.Domain;
using Xunit;

namespace DashboardService.Test;

public class LuceneInMemoryFixture : IAsyncLifetime
{
    private readonly LucenePolicyRepository policyRepo = new LucenePolicyRepository();

    public async Task InitializeAsync()
    {
        await Task.CompletedTask;
        InsertData();
    }

    public Task DisposeAsync()
    {
        policyRepo.Dispose();
        return Task.CompletedTask;
    }

    public LucenePolicyRepository Repository() => policyRepo;

    private void InsertData()
    {
        var policyRepo = Repository();
        //products TRI,HSI,FAI,CAR

        var agent = "jimmy.solid";
        //january-2020
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-01-01", "2020-12-31")
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-01-15", "2021-01-14")
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("HSI")
                .WithDates("2020-01-15", "2021-01-14")
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("FAI")
                .WithDates("2020-01-15", "2021-01-14")
                .WithPremium(150M)
                .Build()
        );
        //feb-2020
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-02-01", "2021-01-31")
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("HSI")
                .WithDates("2020-02-15", "2021-02-14")
                .WithPremium(80M)
                .Build()
        );
        //march-2020
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-03-01", "2021-02-28")
                .WithPremium(50M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-03-15", "2021-03-14")
                .WithPremium(25M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-03-15", "2021-03-14")
                .WithPremium(15M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("HSI")
                .WithDates("2020-03-15", "2021-03-14")
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("FAI")
                .WithDates("2020-03-15", "2021-03-14")
                .WithPremium(250M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("FAI")
                .WithDates("2020-03-15", "2021-03-14")
                .WithPremium(250M)
                .Build()
        );

        //agent danny.solid
        agent = "danny.solid";
        //january-2020
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-01-01", "2020-12-31")
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("HSI")
                .WithDates("2020-01-01", "2020-12-31")
                .WithPremium(50M)
                .Build()
        );
        //feb-2020
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-02-01", "2021-01-31")
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("HSI")
                .WithDates("2020-02-01", "2021-01-31")
                .WithPremium(25M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("FAI")
                .WithDates("2020-02-01", "2021-01-31")
                .WithPremium(50M)
                .Build()
        );
        //march-2020
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("TRI")
                .WithDates("2020-03-01", "2021-02-28")
                .WithPremium(50M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("HSI")
                .WithDates("2020-03-01", "2021-02-28")
                .WithPremium(50M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("HSI")
                .WithDates("2020-03-01", "2021-02-28")
                .WithPremium(50M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("FAI")
                .WithDates("2020-03-01", "2021-02-28")
                .WithPremium(25M)
                .Build()
        );
        policyRepo.Save
        (
            PolicyDocumentBuilder.Create()
                .WithAgent(agent)
                .WithProduct("FAI")
                .WithDates("2020-03-01", "2021-02-28")
                .WithPremium(25M)
                .Build()
        );
    }
}

[CollectionDefinition("Lucene in memory")]
public class LuceneInMemoryCollection : ICollectionFixture<LuceneInMemoryFixture>
{
}
