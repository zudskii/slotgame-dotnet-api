namespace SlotGame.Core.Rng;

public interface IRngProvider
{
    int Next(int minInclusive, int maxExclusive);
}