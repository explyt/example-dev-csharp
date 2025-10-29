using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PaymentService.Domain;

namespace PaymentService.DataAccess.EF;

public class EFPolicyAccountRepository(PaymentDbContext dbContext) : IPolicyAccountRepository
{
    private readonly PaymentDbContext dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    public void Add(PolicyAccount policyAccount)
    {
        dbContext.PolicyAccounts.Add(policyAccount);
    }

    public void Update(PolicyAccount policyAccount)
    {
        dbContext.PolicyAccounts.Update(policyAccount);
    }

    public async Task<PolicyAccount> FindByNumber(string policyNumber)
    {
        return await dbContext.PolicyAccounts
            .Include(p => p.Entries)
            .FirstOrDefaultAsync(p => p.PolicyNumber == policyNumber);
    }

    public async Task<bool> ExistsWithPolicyNumber(string policyNumber)
    {
        return await dbContext.PolicyAccounts
            .AnyAsync(p => p.PolicyNumber == policyNumber);
    }
}
