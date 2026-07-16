using SlotGame.Core.Engine;
using SlotGame.Core.Rng;
using SlotGame.Core.Config;

const int spinCount = 5_000_000;
const decimal betAmount = 1m;

var reels = DemoGameConfig.BuildReels();
var paylines = DemoGameConfig.BuildPaylines();
var paytable = DemoGameConfig.BuildPaytable();
var engine = new SpinEngine(reels, new CryptoRngProvider(), paytable, paylines);

decimal totalBet = 0m;
decimal totalWin = 0m;
long winningSpins = 0;

for (int i = 0; i < spinCount; i++)
{
    var result = engine.Spin(betAmount);
    totalBet += betAmount;
    totalWin += result.TotalWin;

    if (result.TotalWin > 0)
        winningSpins++;
}

decimal rtp = totalWin / totalBet;
decimal hitFrequency = (decimal)winningSpins / spinCount;

Console.WriteLine($"Spins:          {spinCount:N0}");
Console.WriteLine($"RTP:            {rtp:P3}");
Console.WriteLine($"Hit frequency:  {hitFrequency:P2}");