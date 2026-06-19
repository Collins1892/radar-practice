using AuditsApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AuditsApi.Data;

public class AuditsDbContext : DbContext
{
    public AuditsDbContext(DbContextOptions<AuditsDbContext> options) : base(options) { }

    public DbSet<Audit> Audits => Set<Audit>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Audit>()
            .Property(a => a.Title)
            .HasMaxLength(200);

        modelBuilder.Entity<Audit>()
            .Property(a => a.Status)
            .HasConversion<int>();

        modelBuilder.Entity<Audit>()
            .Property(a => a.RecordStatus)
            .HasConversion<int>();
    }
}
