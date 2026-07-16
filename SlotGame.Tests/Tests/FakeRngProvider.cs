using SlotGame.Core.Rng;

namespace SlotGame.Tests;

/// <summary>
/// Deterministic RNG for tests — returns a fixed sequence instead of random values.
/// Each call to Next() returns the next value in the sequence, cycling if exhausted.
/// </summary>

public sealed class FakeRngProvider: IRngProvider
{
    private readonly int[] _sequence;
    private int _index;

    public FakeRngProvider(params int[] sequence)
    {
        if(sequence is null || sequence.Length == 0)
            throw new ArgumentException("Sequence cannot be null or empty.", nameof(sequence));

        _sequence = sequence;
    }

    public int Next(int minInclusive, int maxExclusive)
    {
      int value =  _sequence[_index % _sequence.Length];
        _index++;
        return value;
    }
}