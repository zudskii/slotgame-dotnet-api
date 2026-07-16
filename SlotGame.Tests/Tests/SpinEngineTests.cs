using SlotGame.Core.Engine;
using SlotGame.Core.Paytable;
using SlotGame.Core.Reels;
using Xunit;

namespace SlotGame.Tests;

public class SpinEngineTests
{
    private static Paytable BuildPaytable() => new(new[]
    {
        new SymbolPayout(SymbolType.Cherry, new decimal[] { 0, 0, 0, 5, 15, 40 }),
        new SymbolPayout(SymbolType.Bell,   new decimal[] { 0, 0, 0, 10, 30, 100 }),
        new SymbolPayout(SymbolType.Wild,   new decimal[] { 0, 0, 0, 100, 500, 2500 }),
    });

    [Fact]
    public void Spin_ThreeMatchingCherries_PaysCorrectAmount()
    {
        var strip = new ReelStrip(new[] { SymbolType.Cherry, SymbolType.Cherry, SymbolType.Cherry });
        var reels = new[] { strip, strip, strip };
        var paylines = new[] { new Payline(1, new[] { 0, 0, 0 }) };
        var fakeRng = new FakeRngProvider(0, 0, 0);
        var engine = new SpinEngine(reels, fakeRng, BuildPaytable(), paylines, visibleRows: 1);

        var result = engine.Spin(betAmount: 1m);

        Assert.Equal(5m, result.TotalWin);
        Assert.Single(result.WinningLines);
        Assert.Equal(SymbolType.Cherry, result.WinningLines[0].Symbol);
        Assert.Equal(3, result.WinningLines[0].MatchCount);
    }

    [Fact]
    public void Spin_NoMatch_ReturnsZeroWin()
    {
        // Reel strips positioned so line result is Cherry, Bell, Cherry — no run of 3
        var reel0 = new ReelStrip(new[] { SymbolType.Cherry });
        var reel1 = new ReelStrip(new[] { SymbolType.Bell });
        var reel2 = new ReelStrip(new[] { SymbolType.Cherry });
        var reels = new[] { reel0, reel1, reel2 };
        var paylines = new[] { new Payline(1, new[] { 0, 0, 0 }) };
        var fakeRng = new FakeRngProvider(0, 0, 0);
        var engine = new SpinEngine(reels, fakeRng, BuildPaytable(), paylines, visibleRows: 1);

        var result = engine.Spin(betAmount: 1m);

        Assert.Equal(0m, result.TotalWin);
        Assert.Empty(result.WinningLines);
    }

    [Fact]
    public void Spin_WildSubstitutesForRegularSymbol_PaysAsSubstitutedSymbol()
    {
        // Wild, Wild, Bell, Bell, Cherry → should resolve as 4x Bell
        var reelWild = new ReelStrip(new[] { SymbolType.Wild });
        var reelBell = new ReelStrip(new[] { SymbolType.Bell });
        var reelCherry = new ReelStrip(new[] { SymbolType.Cherry });
        var reels = new[] { reelWild, reelWild, reelBell, reelBell, reelCherry };
        var paylines = new[] { new Payline(1, new[] { 0, 0, 0, 0, 0 }) };
        var fakeRng = new FakeRngProvider(0, 0, 0, 0, 0);
        var engine = new SpinEngine(reels, fakeRng, BuildPaytable(), paylines, visibleRows: 1);

        var result = engine.Spin(betAmount: 1m);

        Assert.Equal(30m, result.TotalWin); // Bell x4 coefficient = 30
        Assert.Equal(SymbolType.Bell, result.WinningLines[0].Symbol);
        Assert.Equal(4, result.WinningLines[0].MatchCount);
    }

    [Fact]
    public void Spin_AllWild_PaysAsWild()
    {
        var reelWild = new ReelStrip(new[] { SymbolType.Wild });
        var reels = new[] { reelWild, reelWild, reelWild };
        var paylines = new[] { new Payline(1, new[] { 0, 0, 0 }) };
        var fakeRng = new FakeRngProvider(0, 0, 0);
        var engine = new SpinEngine(reels, fakeRng, BuildPaytable(), paylines, visibleRows: 1);

        var result = engine.Spin(betAmount: 1m);

        Assert.Equal(100m, result.TotalWin); // Wild x3 coefficient = 100
        Assert.Equal(SymbolType.Wild, result.WinningLines[0].Symbol);
    }

    [Fact]
    public void Spin_ScatterBreaksLine_DoesNotCountTowardMatch()
    {
        // Cherry, Scatter, Cherry — Scatter breaks the run at position 1
        var reelCherry = new ReelStrip(new[] { SymbolType.Cherry });
        var reelScatter = new ReelStrip(new[] { SymbolType.Scatter });
        var reels = new[] { reelCherry, reelScatter, reelCherry };
        var paylines = new[] { new Payline(1, new[] { 0, 0, 0 }) };
        var fakeRng = new FakeRngProvider(0, 0, 0);
        var engine = new SpinEngine(reels, fakeRng, BuildPaytable(), paylines, visibleRows: 1);

        var result = engine.Spin(betAmount: 1m);

        Assert.Equal(0m, result.TotalWin);
        Assert.Empty(result.WinningLines);
    }

    [Fact]
    public void Spin_ZeroOrNegativeBet_ThrowsArgumentOutOfRangeException()
    {
        var strip = new ReelStrip(new[] { SymbolType.Cherry });
        var reels = new[] { strip };
        var paylines = new[] { new Payline(1, new[] { 0 }) };
        var engine = new SpinEngine(reels, new FakeRngProvider(0), BuildPaytable(), paylines, visibleRows: 1);

        Assert.Throws<ArgumentOutOfRangeException>(() => engine.Spin(0m));
        Assert.Throws<ArgumentOutOfRangeException>(() => engine.Spin(-5m));
    }

    [Fact]
    public void Constructor_EmptyReels_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            new SpinEngine(Array.Empty<ReelStrip>(), new FakeRngProvider(0), BuildPaytable(), Array.Empty<Payline>()));
    }
}