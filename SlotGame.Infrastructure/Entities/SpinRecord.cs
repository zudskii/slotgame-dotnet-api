namespace SlotGame.Infrastructure.Entities;

public sealed class SpinRecord
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public Guid IdempotencyKey { get; set; }
    public decimal BetAmount { get; set; }
    public decimal WinAmount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string GridJson { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}