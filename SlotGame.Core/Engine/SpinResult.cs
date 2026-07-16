using SlotGame.Core.Paytable;

namespace SlotGame.Core.Engine;

public sealed record WinLine(Payline Line, SymbolType Symbol, int MatchCount, decimal Payout);

public sealed record SpinResult(
    SymbolType[][] Grid,
    decimal BetAmount,
    decimal TotalWin,
    IReadOnlyList<WinLine> WinningLines);
