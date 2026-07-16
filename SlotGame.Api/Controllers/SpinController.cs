using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SlotGame.Api.Dtos;
using SlotGame.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;
namespace SlotGame.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // ⚠️ ამის გარეშე ვინმეს token-ის გარეშეც შეუძლია spin
public sealed class SpinController : ControllerBase
{
    private readonly SpinTransactionService _spinService;

    public SpinController(SpinTransactionService spinService)
    {
        _spinService = spinService;
    }

    [HttpPost]
    [EnableRateLimiting("SpinPolicy")]
    public async Task<ActionResult<SpinResponse>> Spin([FromBody] SpinRequest request)
    {
        if (request.BetAmount <= 0)
            return BadRequest("Bet amount must be positive.");

        var playerId = GetPlayerIdFromToken();
        if (playerId is null)
            return Unauthorized();


        var (result, newBalance, wasReplayed) = await _spinService.SpinAsync(
            playerId.Value, request.BetAmount, request.IdempotencyKey);

        if (wasReplayed)
            Response.Headers.Append("X-Idempotent-Replay", "true");

        var response = new SpinResponse(
            Grid: result.Grid.Select(reel => reel.Select(s => s.ToString()).ToArray()).ToArray(),
            BetAmount: result.BetAmount,
            TotalWin: result.TotalWin,
            WinningLines: result.WinningLines
                .Select(w => new WinLineDto(w.Line.Id, w.Symbol.ToString(), w.MatchCount, w.Payout))
                .ToArray(),
            NewBalance: newBalance);

        return Ok(response);
    }



    private Guid? GetPlayerIdFromToken()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");

        return Guid.TryParse(sub, out var id) ? id : null;
    }
}