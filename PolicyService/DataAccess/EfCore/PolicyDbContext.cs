using Microsoft.EntityFrameworkCore;
using PolicyService.Domain;

namespace PolicyService.DataAccess.EfCore;

public class PolicyDbContext : DbContext
{
    public PolicyDbContext(DbContextOptions<PolicyDbContext> options) : base(options) { }
    
    public DbSet<Offer> Offers { get; set; }
    public DbSet<Policy> Policies { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Offer>(entity =>
        {
            entity.HasKey(e => e.Number);
            entity.Property(e => e.Number).ValueGeneratedNever();
            entity.OwnsOne(e => e.PolicyValidityPeriod);
            entity.OwnsOne(e => e.PolicyHolder);
            entity.OwnsMany(e => e.Covers, cover =>
            {
                cover.WithOwner().HasForeignKey("OfferNumber");
                cover.Property<int>("Id").ValueGeneratedOnAdd();
                cover.HasKey("Id");
            });
        });

        modelBuilder.Entity<Policy>(entity =>
        {
            entity.HasKey(e => e.Number);
            entity.Property(e => e.Number).ValueGeneratedNever();
            entity.OwnsMany(e => e.Versions, version =>
            {
                version.WithOwner().HasForeignKey("PolicyNumber");
                version.Property<int>("Id").ValueGeneratedOnAdd();
                version.HasKey("Id");
                version.OwnsOne(v => v.PolicyHolder);
                version.OwnsOne(v => v.CoverPeriod);
                version.OwnsMany(v => v.Covers, cover =>
                {
                    cover.WithOwner().HasForeignKey("PolicyVersionId");
                    cover.Property<int>("Id").ValueGeneratedOnAdd();
                    cover.HasKey("Id");
                });
            });
        });
    }
}