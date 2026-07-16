using SlotGame.Core.Paytable;

namespace SlotGame.Core.Reels;
public sealed class ReelStrip
{
    private readonly SymbolType[] _strip;

    public ReelStrip(SymbolType[] strip)
    {
         if(strip is null || strip.Length == 0)
            throw new ArgumentException("Reel strip cannot be null or empty.", nameof(strip));
        _strip = strip;
    }

    public int Length => _strip.Length;

    public SymbolType GetSymbolAt(int position)
    {
        int normalized = ((position % _strip.Length) + _strip.Length) % _strip.Length;
        return _strip[normalized];
    }
    public SymbolType[] GetVisibleWindow(int stopPosition, int rowCount)
    {
        var window = new SymbolType[rowCount];
        for (int row = 0; row < rowCount; row++)
        {
            window[row] = GetSymbolAt(stopPosition +  row);
        }
        return window;
    }
}