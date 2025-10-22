using System.Threading.Tasks;
using PricingService.Domain;

namespace PricingService.DataAccess.EfCore;

public class EfDataStore : IDataStore
{
    private readonly PricingDbContext _context;

    public EfDataStore(PricingDbContext context)
    {
        _context = context;
        Tariffs = new EfTariffRepository(_context);
    }

    public ITariffRepository Tariffs { get; }

    public async Task CommitChanges()
    {
        await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        // DbContext is scoped by DI; do not dispose here.
    }
}