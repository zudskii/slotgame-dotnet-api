using System.ComponentModel.DataAnnotations;
using SlotGame.Core.Config;

namespace SlotGame.Api.Dtos;


public sealed record SpinRequest([property: Range(typeof(decimal), "0.10", "500")]
    decimal BetAmount,
    
    [property: Required]
    Guid IdempotencyKey);

public sealed record SpinResponse(
    string[][] Grid,
    decimal BetAmount,
    decimal TotalWin,
    WinLineDto[] WinningLines,
    decimal NewBalance);

public sealed record WinLineDto(int PaylineId, string Symbol, int MatchCount, decimal Payout);