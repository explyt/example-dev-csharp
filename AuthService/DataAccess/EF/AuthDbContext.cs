using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using AuthService.Domain;

namespace AuthService.DataAccess.EF;

public class AuthDbContext : DbContext
{
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
    {
    }

    public DbSet<InsuranceAgent> InsuranceAgents { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.EnableSensitiveDataLogging();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InsuranceAgent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Login).IsUnique();
            entity.Property(e => e.Login).IsRequired();
            entity.Property(e => e.Password).IsRequired();
            entity.Property(e => e.Avatar).IsRequired();
            entity.Property(e => e.AvailableProducts)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                );
        });
    }
}
