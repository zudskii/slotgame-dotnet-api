using System.Security.Cryptography;

namespace SlotGame.Core.Rng;

public sealed class CryptoRngProvider : IRngProvider
{
    public int Next(int minInclusive, int maxExclusive)
    {
        if (minInclusive >= maxExclusive)
            throw new ArgumentException($"{nameof(minInclusive)} must be less than {nameof(maxExclusive)}");

        return RandomNumberGenerator.GetInt32(minInclusive, maxExclusive);
    }
}
