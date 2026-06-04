using IncidentsApi;
using Microsoft.EntityFrameworkCore;

namespace IncidentsApi.Data;

public class IncidentsDbContext : DbContext
{
    public IncidentsDbContext(DbContextOptions<IncidentsDbContext> options) : base(options) { }

    public DbSet<Incident> Incidents => Set<Incident>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Incident>()
            .Property(i => i.Title)
            .HasMaxLength(50);

        modelBuilder.Entity<Incident>()
            .Property(i => i.Description)
            .HasMaxLength(100);

        modelBuilder.Entity<Incident>()
            .Property(i => i.Location)
            .HasMaxLength(100);

        modelBuilder.Entity<Incident>()
            .Property(i => i.Severity)
            .HasConversion<int>();

        modelBuilder.Entity<Incident>()
            .Property(i => i.Status)
            .HasConversion<int>();
    }
}
