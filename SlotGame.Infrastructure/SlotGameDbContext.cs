using Microsoft.EntityFrameworkCore;
using SlotGame.Infrastructure.Entities;

namespace SlotGame.Infrastructure;

public sealed class SlotGameDbContext : DbContext
{
    public SlotGameDbContext(DbContextOptions<SlotGameDbContext> options) : base(options) { }

    public DbSet<Player> Players => Set<Player>();
    public DbSet<SpinRecord> SpinRecords => Set<SpinRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Player>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Balance).HasColumnType("numeric(18,2)");
            e.HasIndex(p => p.Username).IsUnique();
        });

        modelBuilder.Entity<SpinRecord>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.BetAmount).HasColumnType("numeric(18,2)");
            e.Property(s => s.WinAmount).HasColumnType("numeric(18,2)");
            e.Property(s => s.BalanceAfter).HasColumnType("numeric(18,2)");
            e.HasIndex(s => s.PlayerId);

            // Composite unique index — same player CAN reuse a key across different
            // players (unlikely, but not our concern), but the SAME player can never
            // have two spin records under the same idempotency key.
            e.HasIndex(s => new { s.PlayerId, s.IdempotencyKey }).IsUnique();
        });
        
    }
}