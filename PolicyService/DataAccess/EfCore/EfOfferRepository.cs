using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PolicyService.Domain;

namespace PolicyService.DataAccess.EfCore;

public class EfOfferRepository : IOfferRepository
{
    private readonly PolicyDbContext _context;

    public EfOfferRepository(PolicyDbContext context)
    {
        _context = context;
    }

    public void Add(Offer offer)
    {
        _context.Offers.Add(offer);
    }

    public async Task<Offer> WithNumber(string number)
    {
        return await _context.Offers
            .Include(o => o.Covers)
            .FirstOrDefaultAsync(o => o.Number == number);
    }
}