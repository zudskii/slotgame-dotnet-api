using SlotGame.Core.Paytable;
using SlotGame.Core.Reels;
using SlotGame.Core.Rng;

namespace SlotGame.Core.Engine;

public sealed class SpinEngine
{
    
    private readonly ReelStrip[] _reels;
    private readonly IRngProvider _rng;
    private readonly Paytable.Paytable _paytable;
    private readonly Payline[] _paylines;
    private readonly int _visibleRows;

    public SpinEngine(
        ReelStrip[] reels,
        IRngProvider rng,
        Paytable.Paytable paytable,
        Payline[] paylines,
        int visibleRows = 3)
    {
        if (reels is null || reels.Length == 0)
            throw new ArgumentException("At least one reel is required.", nameof(reels));

        _reels = reels;
        _rng = rng;
        _paytable = paytable;
        _paylines = paylines;
        _visibleRows = visibleRows;
    }

    private static (SymbolType Symbol, int Count) EvaluateLine(SymbolType[][] grid, Payline line)
    {
        SymbolType? target = null;
        int count = 0;

        for (int reelIndex = 0; reelIndex < line.RowPerReel.Length; reelIndex++)
        {
            int row = line.RowPerReel[reelIndex];
            var symbol = grid[reelIndex][row];

            if (symbol == SymbolType.Scatter)
                break;

            if (target is null)
            {
                target = symbol;
                count = 1;
                continue;
            }

            bool matches = symbol == target || symbol == SymbolType.Wild
                           || (target == SymbolType.Wild && symbol != SymbolType.Scatter);

            if (!matches)
                break;

            if (target == SymbolType.Wild && symbol != SymbolType.Wild)
                target = symbol;

            count++;
        }

        return (target ?? SymbolType.Cherry, count);
    }

    public SpinResult Spin(decimal betAmount)
    {
        if (betAmount <= 0)
            throw new ArgumentOutOfRangeException(nameof(betAmount), "Bet must be positive.");

        var grid = new SymbolType[_reels.Length][];
        for (int reelIndex = 0; reelIndex < _reels.Length; reelIndex++)
        {
            int stopPosition = _rng.Next(0, _reels[reelIndex].Length);
            grid[reelIndex] = _reels[reelIndex].GetVisibleWindow(stopPosition, _visibleRows);
        }

        var winningLines = new List<WinLine>();
        decimal totalWin = 0m;

        foreach (var line in _paylines)
        {
            var (symbol, count) = EvaluateLine(grid, line);

            if (count < 3)
                continue;

            var payout = _paytable.GetPayout(symbol, count, betAmount);
            if (payout <= 0)
                continue;

            totalWin += payout;
            winningLines.Add(new WinLine(line, symbol, count, payout));
        }
        return new SpinResult(grid, betAmount, totalWin, winningLines);
    }
}