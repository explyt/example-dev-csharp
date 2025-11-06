using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PolicyService.Domain;

namespace PolicyService.DataAccess.EfCore;

public class EfPolicyRepository : IPolicyRepository
{
    private readonly PolicyDbContext _context;

    public EfPolicyRepository(PolicyDbContext context)
    {
        _context = context;
    }

    public void Add(Policy policy)
    {
        _context.Policies.Add(policy);
    }

    public async Task<Policy> WithNumber(string number)
    {
        return await _context.Policies
            .Include(p => p.Versions)
                .ThenInclude(v => v.Covers)
            .FirstOrDefaultAsync(p => p.Number == number);
    }
}