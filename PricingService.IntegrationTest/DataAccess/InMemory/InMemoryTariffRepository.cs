using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PricingService.Domain;

namespace PricingService.IntegrationTest.DataAccess.InMemory;

public class InMemoryTariffRepository : ITariffRepository
{
    private readonly Dictionary<string, Tariff> _tariffs = new();

    public void Add(Tariff tariff)
    {
        if (tariff != null && !string.IsNullOrEmpty(tariff.Code))
        {
            _tariffs[tariff.Code] = tariff;
        }
    }

    public Task<bool> Exists(string code)
    {
        return Task.FromResult(_tariffs.ContainsKey(code));
    }

    public Task<Tariff> WithCode(string code)
    {
        _tariffs.TryGetValue(code, out var tariff);
        return Task.FromResult(tariff);
    }

    public Task<Tariff> this[string code] => WithCode(code);
}
