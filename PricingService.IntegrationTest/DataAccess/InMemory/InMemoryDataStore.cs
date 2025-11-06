using System;
using System.Threading.Tasks;
using PricingService.Domain;

namespace PricingService.IntegrationTest.DataAccess.InMemory;

public class InMemoryDataStore : IDataStore
{
    public InMemoryDataStore()
    {
        Tariffs = new InMemoryTariffRepository();
    }

    public ITariffRepository Tariffs { get; }

    public Task CommitChanges()
    {
        // In-memory store commits immediately, so this is a no-op
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        // Nothing to dispose in the in-memory implementation
    }
}
