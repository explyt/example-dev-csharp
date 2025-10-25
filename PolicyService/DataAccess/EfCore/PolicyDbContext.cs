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
            entity.OwnsOne(e => e.PolicyHolder, ph =>
            {
                // Ensure Address is configured as an owned value object
                ph.OwnsOne(p => p.Address);
            });
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
                // Use a shadow key that does not conflict with CLR property PolicyVersion.Id (Guid?)
                version.Property<int>("InternalId").ValueGeneratedOnAdd();
                version.HasKey("InternalId");
                version.OwnsOne(v => v.PolicyHolder, ph =>
                {
                    // Ensure Address is configured as an owned value object
                    ph.OwnsOne(p => p.Address);
                });
                // Explicitly configure owned value objects to avoid ownership ambiguity
                version.OwnsOne(v => v.CoverPeriod);
                version.OwnsOne(v => v.VersionValidityPeriod);
                version.OwnsMany(v => v.Covers, cover =>
                {
                    cover.WithOwner().HasForeignKey("PolicyVersionId");
                    cover.Property<int>("Id").ValueGeneratedOnAdd();
                    cover.HasKey("Id");
                    // Explicitly configure the owned ValidityPeriod within PolicyCover
                    cover.OwnsOne(c => c.CoverPeriod);
                });
            });
        });
    }
}
