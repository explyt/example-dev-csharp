using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using AuthService.Domain;

namespace AuthService.DataAccess.EF;

public class InsuranceAgentRepository : IInsuranceAgents
{
    private readonly AuthDbContext dbContext;

    public InsuranceAgentRepository(AuthDbContext dbContext)
    {
        this.dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public void Add(InsuranceAgent agent)
    {
        dbContext.InsuranceAgents.Add(agent);
    }

    public InsuranceAgent FindByLogin(string login)
    {
        return dbContext.InsuranceAgents
            .FirstOrDefault(a => a.Login == login);
    }
}
