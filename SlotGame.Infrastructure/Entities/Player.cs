namespace SlotGame.Infrastructure.Entities;

public sealed class Player
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public decimal Balance { get; set; }
}