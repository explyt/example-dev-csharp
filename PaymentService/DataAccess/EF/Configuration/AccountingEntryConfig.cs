using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentService.Domain;

namespace PaymentService.DataAccess.EF.Configuration;

internal class AccountingEntryConfig : IEntityTypeConfiguration<AccountingEntry>
{
    public void Configure(EntityTypeBuilder<AccountingEntry> entity)
    {
        entity.ToTable("AccountingEntry");
        entity.HasKey(e => e.Id);
        
        entity.HasDiscriminator<string>("EntryType")
            .HasValue<ExpectedPayment>("ExpectedPayment")
            .HasValue<InPayment>("InPayment")
            .HasValue<OutPayment>("OutPayment");

        entity.Property(e => e.CreationDate).IsRequired();
        entity.Property(e => e.EffectiveDate).IsRequired();
        entity.Property(e => e.Amount).IsRequired().HasPrecision(18, 2);

        entity.HasOne(e => e.PolicyAccount)
            .WithMany(p => p.Entries)
            .HasForeignKey("PolicyAccountId")
            .IsRequired();
    }
}
