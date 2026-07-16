namespace SlotGame.Core.Paytable;

public sealed record SymbolPayout(SymbolType Type, decimal[] PayoutByCount)
{
    public decimal GetCoefficient(int matchCount)
    {
        if(matchCount < 0 || matchCount >= PayoutByCount.Length)
            return 0m;
        
        return PayoutByCount[matchCount];
    }
}
