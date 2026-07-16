using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace SlotGame.Api.Controllers;

public sealed record LoginRequest(Guid PlayerId);
public sealed record LoginResponse(string Token, DateTime ExpiresAt);

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IConfiguration _config;

    public AuthController(IConfiguration config)
    {
        _config = config;
    }

    // ⚠️ DEMO ONLY — production-ში ეს გაცვლიდი password/credential ვერიფიკაციაზე.
    // ეს endpoint ახლა ნებისმიერს აძლევს ნებისმიერი PlayerId-ის token-ს —
    // ეს არის placeholder, არა production auth flow.
    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        var jwtSection = _config.GetSection("Jwt");
        var signingKey = jwtSection["SigningKey"]!;
        var expiresAt = DateTime.UtcNow.AddHours(1);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, request.PlayerId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return Ok(new LoginResponse(tokenString, expiresAt));
    }
}