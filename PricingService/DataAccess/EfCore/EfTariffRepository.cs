using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PricingService.Domain;

namespace PricingService.DataAccess.EfCore;

public class EfTariffRepository : ITariffRepository
{
    private readonly PricingDbContext _context;

    public EfTariffRepository(PricingDbContext context)
    {
        _context = context;
    }

    public void Add(Tariff tariff)
    {
        _context.Tariffs.Add(tariff);
    }

    public async Task<bool> Exists(string code)
    {
        return await _context.Tariffs.AnyAsync(t => t.Code == code);
    }

    public async Task<Tariff> WithCode(string code)
    {
        return await _context.Tariffs.FirstOrDefaultAsync(t => t.Code == code);
    }

    public Task<Tariff> this[string code] => WithCode(code);
}