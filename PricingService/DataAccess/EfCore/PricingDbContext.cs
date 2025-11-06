using Microsoft.EntityFrameworkCore;
using PricingService.Domain;

namespace PricingService.DataAccess.EfCore;

public class PricingDbContext : DbContext
{
    public PricingDbContext(DbContextOptions<PricingDbContext> options) : base(options)
    {
    }

    public DbSet<Tariff> Tariffs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Tariff entity
        modelBuilder.Entity<Tariff>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired();
        });
    }
}
