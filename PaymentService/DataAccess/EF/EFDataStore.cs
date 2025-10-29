using System;
using System.Threading.Tasks;
using PaymentService.Domain;

namespace PaymentService.DataAccess.EF;

public class EFDataStore(PaymentDbContext dbContext, IPolicyAccountRepository policyAccountRepository)
    : IDataStore
{
    private readonly PaymentDbContext dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    public IPolicyAccountRepository PolicyAccounts { get; } = policyAccountRepository ?? throw new ArgumentNullException(nameof(policyAccountRepository));

    public async Task CommitChanges()
    {
        await dbContext.SaveChangesAsync();
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
        {
            dbContext.Dispose();
        }
    }
}
