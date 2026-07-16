using Microsoft.EntityFrameworkCore;
using SlotGame.Core.Engine;
using SlotGame.Infrastructure.Entities;
using Microsoft.Extensions.Logging;
using SlotGame.Core.Config;
namespace SlotGame.Infrastructure;

public sealed class InsufficientBalanceException : Exception
{
    public InsufficientBalanceException() : base("Insufficient balance for this bet.") { }
}
public sealed class InvalidBetAmountException : Exception
{
    public InvalidBetAmountException(decimal betAmount, decimal min, decimal max)
        : base($"Bet amount {betAmount} is outside allowed range [{min}, {max}].") { }
}

public sealed class PlayerNotFoundException : Exception
{
    public PlayerNotFoundException(Guid playerId) : base($"Player {playerId} not found.") { }
}

public sealed class SpinTransactionService
{
    private readonly SlotGameDbContext _db;
    private readonly SpinEngine _spinEngine;
    private readonly ILogger<SpinTransactionService> _logger;

    public SpinTransactionService(
        SlotGameDbContext db,
        SpinEngine spinEngine,
        ILogger<SpinTransactionService> logger)
    {
        _db = db;
        _spinEngine = spinEngine;
        _logger = logger;
    }

    public async Task<(SpinResult Result, decimal NewBalance, bool WasReplayed)> SpinAsync(
        Guid playerId, decimal betAmount, Guid idempotencyKey)
    {
        if (betAmount < BettingLimits.MinBet || betAmount > BettingLimits.MaxBet)
            throw new InvalidBetAmountException(betAmount, BettingLimits.MinBet, BettingLimits.MaxBet);

        var existing = await _db.SpinRecords
            .SingleOrDefaultAsync(s => s.PlayerId == playerId && s.IdempotencyKey == idempotencyKey);

        if (existing is not null)
        {
            _logger.LogInformation(
                "Idempotent replay for PlayerId={PlayerId}, IdempotencyKey={IdempotencyKey}",
                playerId, idempotencyKey);

            var replayedResult = System.Text.Json.JsonSerializer.Deserialize<SpinResult>(existing.GridJson)
                ?? throw new InvalidOperationException("Corrupted spin record — cannot deserialize.");
            return (replayedResult, existing.BalanceAfter, WasReplayed: true);
        }

        await using var transaction = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.ReadCommitted);

        try
        {
            var player = await _db.Players
                .FromSqlInterpolated($"SELECT * FROM \"Players\" WHERE \"Id\" = {playerId} FOR UPDATE")
                .SingleOrDefaultAsync();

            if (player is null)
            {
                _logger.LogWarning("Spin attempted for non-existent PlayerId={PlayerId}", playerId);
                throw new PlayerNotFoundException(playerId);
            }

            if (player.Balance < betAmount)
            {
                _logger.LogWarning(
                    "Insufficient balance: PlayerId={PlayerId}, Balance={Balance}, BetAmount={BetAmount}",
                    playerId, player.Balance, betAmount);
                throw new InsufficientBalanceException();
            }

            player.Balance -= betAmount;
            var result = _spinEngine.Spin(betAmount);
            player.Balance += result.TotalWin;

            _db.SpinRecords.Add(new SpinRecord
            {
                Id = Guid.NewGuid(),
                PlayerId = playerId,
                IdempotencyKey = idempotencyKey,
                BetAmount = betAmount,
                WinAmount = result.TotalWin,
                BalanceAfter = player.Balance,
                GridJson = System.Text.Json.JsonSerializer.Serialize(result),
                CreatedAt = DateTimeOffset.UtcNow,
            });

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation(
                "Spin completed: PlayerId={PlayerId}, BetAmount={BetAmount}, TotalWin={TotalWin}, NewBalance={NewBalance}",
                playerId, betAmount, result.TotalWin, player.Balance);

            return (result, player.Balance, WasReplayed: false);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            await transaction.RollbackAsync();

            _logger.LogInformation(
                "Concurrent idempotency race resolved: PlayerId={PlayerId}, IdempotencyKey={IdempotencyKey}",
                playerId, idempotencyKey);

            var winner = await _db.SpinRecords
                .SingleAsync(s => s.PlayerId == playerId && s.IdempotencyKey == idempotencyKey);
            var winnerResult = System.Text.Json.JsonSerializer.Deserialize<SpinResult>(winner.GridJson)
                ?? throw new InvalidOperationException("Corrupted spin record — cannot deserialize.");
            return (winnerResult, winner.BalanceAfter, WasReplayed: true);
        }
        catch (Exception ex) when (ex is not PlayerNotFoundException and not InsufficientBalanceException)
        {
            _logger.LogError(ex, "Unexpected error during spin: PlayerId={PlayerId}", playerId);
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex) =>
        ex.InnerException is Npgsql.PostgresException { SqlState: "23505" };

}
