using System.ComponentModel.DataAnnotations;
using SlotGame.Core.Config;

namespace SlotGame.Api.Dtos;


public sealed record SpinRequest(
    [param: Range(typeof(decimal), "0.10", "500")]
    decimal BetAmount,

    [param: NotEmptyGuid]
    Guid IdempotencyKey
);
public sealed class NotEmptyGuidAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        return value is Guid guid && guid != Guid.Empty;
    }
}

public sealed record SpinResponse(
    string[][] Grid,
    decimal BetAmount,
    decimal TotalWin,
    WinLineDto[] WinningLines,
    decimal NewBalance);

public sealed record WinLineDto(int PaylineId, string Symbol, int MatchCount, decimal Payout);