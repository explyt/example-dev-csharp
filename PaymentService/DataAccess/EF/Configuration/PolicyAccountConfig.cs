using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentService.Domain;

namespace PaymentService.DataAccess.EF.Configuration;

internal class PolicyAccountConfig : IEntityTypeConfiguration<PolicyAccount>
{
    public void Configure(EntityTypeBuilder<PolicyAccount> entity)
    {
        entity.ToTable("PolicyAccount");
        entity.HasKey(p => p.Id);
        
        entity.Property(p => p.PolicyAccountNumber).IsRequired();
        entity.Property(p => p.PolicyNumber).IsRequired();
        entity.HasIndex(p => p.PolicyNumber).IsUnique();
        
        entity.Property(p => p.Status).HasConversion<string>();

        entity.OwnsOne(p => p.Owner, owner =>
        {
            owner.Property(o => o.FirstName).HasColumnName("OwnerFirstName");
            owner.Property(o => o.LastName).HasColumnName("OwnerLastName");
        });

        entity.HasMany(p => p.Entries)
            .WithOne(e => e.PolicyAccount)
            .HasForeignKey("PolicyAccountId")
            .IsRequired();
    }
}
