using Microsoft.EntityFrameworkCore;
using SlotGame.Core.Config;
using SlotGame.Core.Engine;
using SlotGame.Core.Rng;
using SlotGame.Infrastructure;
using SlotGame.Infrastructure.Entities;
using Microsoft.Extensions.Logging;
using Xunit;

namespace SlotGame.IntegrationTests;

public class ConcurrencyTests
{
    private static readonly string ConnectionString =
    Environment.GetEnvironmentVariable("SLOTGAME_TEST_DB_CONNECTION") ?? "Host=localhost;Database=SlotGame;Username=slotuser;Password=okliko123;Port=5432";

    private static SlotGameDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SlotGameDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new SlotGameDbContext(options);
    }

    private static SpinEngine CreateEngine()
    {
        var reels = DemoGameConfig.BuildReels();
        var paylines = DemoGameConfig.BuildPaylines();
        var paytable = DemoGameConfig.BuildPaytable();
        return new SpinEngine(reels, new CryptoRngProvider(), paytable, paylines);
    }

    [Fact]
    public async Task ConcurrentSpins_SamePlayer_NoDoubleDebit()
    {
        // Arrange — fresh player, known starting balance
        var playerId = Guid.NewGuid();
        const decimal startingBalance = 100m;
        const decimal betAmount = 10m;

        await using (var setupDb = CreateContext())
        {
            setupDb.Players.Add(new Player
            {
                Id = playerId,
                Username = $"concurrency-test-{playerId}",
                Balance = startingBalance
            });
            await setupDb.SaveChangesAsync();
        }

        // Act — fire 2 spins for the SAME player AT THE SAME TIME.
        // Each uses its OWN DbContext — this mirrors two separate HTTP
        // requests hitting the API concurrently (a DbContext is never
        // shared across requests/threads).
        var task1 = RunSpin(playerId, betAmount);
        var task2 = RunSpin(playerId, betAmount);

        var results = await Task.WhenAll(task1, task2);

        // Assert — read the ACTUAL final balance straight from the DB
        await using var verifyDb = CreateContext();
        var finalPlayer = await verifyDb.Players.SingleAsync(p => p.Id == playerId);

        decimal expectedBalance = startingBalance
            - (betAmount * 2)
            + results.Sum(r => r.Result.TotalWin);

        Assert.Equal(expectedBalance, finalPlayer.Balance);

        // No phantom/duplicate writes — exactly 2 spin records, not 1, not 3
        var spinCount = await verifyDb.SpinRecords.CountAsync(s => s.PlayerId == playerId);
        Assert.Equal(2, spinCount);
    }

    private static async Task<(SpinResult Result, decimal NewBalance, bool WasReplayed)> RunSpin(Guid playerId, decimal betAmount)
    {

        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        await using var db = CreateContext();
        var service = new SpinTransactionService(db, CreateEngine(), loggerFactory.CreateLogger<SpinTransactionService>());
        var idempotencyKey = Guid.NewGuid();
        return await service.SpinAsync(playerId, betAmount, idempotencyKey);
    }
} 