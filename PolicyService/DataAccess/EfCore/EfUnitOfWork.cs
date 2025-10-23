using System;
using System.Threading.Tasks;
using PolicyService.Domain;

namespace PolicyService.DataAccess.EfCore;

public class EfUnitOfWork : IUnitOfWork
{
    private readonly PolicyDbContext _context;
    private readonly IOfferRepository _offerRepository;
    private readonly IPolicyRepository _policyRepository;

    public EfUnitOfWork(PolicyDbContext context, IOfferRepository offerRepository, IPolicyRepository policyRepository)
    {
        _context = context;
        _offerRepository = offerRepository;
        _policyRepository = policyRepository;
    }

    public IOfferRepository Offers => _offerRepository;

    public IPolicyRepository Policies => _policyRepository;

    public async Task CommitChanges()
    {
        await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}
