using Microsoft.EntityFrameworkCore;
using PaymentService.DataAccess.EF.Configuration;
using PaymentService.Domain;

namespace PaymentService.DataAccess.EF;

public class PaymentDbContext(DbContextOptions<PaymentDbContext> options) : DbContext(options)
{
    public DbSet<PolicyAccount> PolicyAccounts { get; set; }
    public DbSet<AccountingEntry> AccountingEntries { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.EnableSensitiveDataLogging();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new PolicyAccountConfig());
        modelBuilder.ApplyConfiguration(new AccountingEntryConfig());
    }
}
