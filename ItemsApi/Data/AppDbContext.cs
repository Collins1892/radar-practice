using Microsoft.EntityFrameworkCore;

namespace ItemsApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Item> Items => Set<Item>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Item>()
            .Property(i => i.Price)
            .HasColumnType("REAL");

        modelBuilder.Entity<Item>()
            .Property(i => i.Name)
            .HasMaxLength(100);
    }
}
