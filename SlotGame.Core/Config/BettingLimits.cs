namespace SlotGame.Core.Config;

/// <summary>
/// Business rule, not infrastructure — lives in Core alongside the game math
/// it constrains. Api/Infrastructure layers reference this, not the reverse.
/// </summary>
public static class BettingLimits
{
    public const decimal MinBet = 0.10m;
    public const decimal MaxBet = 500m;
}