using SlotGame.Core.Engine;
using SlotGame.Core.Rng;
using SlotGame.Core.Config;
using Xunit;

namespace SlotGame.Tests;

public class RtpRegressionTests
{
    [Fact]
    public void Simulator_RtpStaysWithinSaneBounds_OverLargeSampleSize()
    {
        const int spinCount = 500_000;
        const decimal betAmount = 1m;

        var reels = DemoGameConfig.BuildReels();
        var paylines = DemoGameConfig.BuildPaylines();
        var paytable = DemoGameConfig.BuildPaytable();
        var engine = new SpinEngine(reels, new CryptoRngProvider(), paytable, paylines);

        decimal totalBet = 0m;
        decimal totalWin = 0m;

        for (int i = 0; i < spinCount; i++)
        {
            var result = engine.Spin(betAmount);
            totalBet += betAmount;
            totalWin += result.TotalWin;
        }

        decimal rtp = totalWin / totalBet;

        Assert.InRange(rtp, 0.80m, 1.10m);
    }
}