namespace SlotGame.Core.Paytable;

public sealed class Paytable
{
    private readonly Dictionary<SymbolType, SymbolPayout> _payouts;

    public Paytable(IEnumerable<SymbolPayout> payouts)
    {
        _payouts = payouts.ToDictionary(p => p.Type, p => p);
    }
    public decimal GetPayout(SymbolType type, int matchCount, decimal betAmount)
    {
        if (matchCount < 3)
            return 0m;
        if (!_payouts.TryGetValue(type, out var payout))
            return 0m;
        return payout.GetCoefficient(matchCount) * betAmount;
    }
}
