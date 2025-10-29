using System.Collections.Generic;
using System.Linq;
using AuthService.DataAccess.EF;
using AuthService.Domain;

namespace AuthService.Init;

public class DataLoader
{
    private readonly AuthDbContext dbContext;

    public DataLoader(AuthDbContext context)
    {
        dbContext = context;
    }

    public void Seed()
    {
        dbContext.Database.EnsureCreated();
        if (dbContext.InsuranceAgents.Any()) return;

        dbContext.InsuranceAgents.Add(new InsuranceAgent("jimmy.solid", "secret", "static/avatars/jimmy_solid.png",
            new List<string> { "TRI", "HSI", "FAI", "CAR" }));
        dbContext.InsuranceAgents.Add(new InsuranceAgent("danny.solid", "secret", "static/avatars/danny.solid.png",
            new List<string> { "TRI", "HSI", "FAI", "CAR" }));
        dbContext.InsuranceAgents.Add(new InsuranceAgent("admin", "admin", "static/avatars/admin.png",
            new List<string> { "TRI", "HSI", "FAI", "CAR" }));

        dbContext.SaveChanges();
    }
}
