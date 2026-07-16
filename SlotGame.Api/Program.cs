using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SlotGame.Core.Config;
using SlotGame.Core.Engine;
using SlotGame.Core.Rng;
using Microsoft.EntityFrameworkCore;
using SlotGame.Infrastructure;
using System.Threading.RateLimiting;
using SlotGame.Api.Middleware;
using HealthChecks.NpgSql;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/slotgame-.log",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

try
{

    Log.Information("Starting SlotGame.Api");
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();

    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("SlotGameDb")!, name: "postgres");

    builder.Services.AddSwaggerGen(c =>
    {
        c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        });
        c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
        });
    });
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        // Per-player limiting — key არის JWT-ის PlayerId (sub claim),
        // არა IP-ს მიხედვით. ეს მნიშვნელოვანია: IP-based limiting
        // ცუდად მუშაობს mobile/NAT-ის უკან მყოფი მრავალი player-ისთვის
        // (ერთი IP, ბევრი ლეგიტიმური player), player-based — ზუსტია.
        options.AddPolicy("SpinPolicy", httpContext =>
        {
            var playerId = httpContext.User.FindFirst("sub")?.Value
                            ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                            ?? httpContext.Connection.RemoteIpAddress?.ToString()
                            ?? "anonymous";

            return RateLimitPartition.GetSlidingWindowLimiter(playerId, _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 10,           // მაქსიმუმ 10 spin
                Window = TimeSpan.FromSeconds(10), // ყოველ 10 წამში
                SegmentsPerWindow = 5,      // sliding window granularity
                QueueLimit = 0,             // ლიმიტის გადაჭარბებისას — მაშინვე 429, არა queue-ში ლოდინი
            });
        });
    });
    builder.Services.AddScoped<SpinTransactionService>();

    // --- Game engine dependency registration ---
    // IRngProvider: Singleton — CryptoRngProvider is stateless and thread-safe
    // (RandomNumberGenerator.GetInt32 is a static, thread-safe call under the hood).
    builder.Services.AddSingleton<IRngProvider, CryptoRngProvider>();
    builder.Services.AddDbContext<SlotGameDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("SlotGameDb")));
    // SpinEngine itself: also Singleton. It holds no mutable state per-request —
    // reels/paytable/paylines are fixed config, RNG calls are thread-safe.
    // This avoids rebuilding the reel/paytable object graph on every request.
    builder.Services.AddSingleton(sp =>
    {
        var rng = sp.GetRequiredService<IRngProvider>();
        var reels = DemoGameConfig.BuildReels();
        var paylines = DemoGameConfig.BuildPaylines();
        var paytable = DemoGameConfig.BuildPaytable();
        return new SpinEngine(reels, rng, paytable, paylines);
    });
    var jwtSection = builder.Configuration.GetSection("Jwt");
    var signingKey = jwtSection["SigningKey"]!;

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtSection["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSection["Audience"],
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                ClockSkew = TimeSpan.FromSeconds(30), // ნაგულისხმევი 5წთ ძალიან ხელგაშლილია
            };
        });

    builder.Services.AddAuthorization();

    var app = builder.Build();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SlotGameDbContext>();
        db.Database.Migrate();
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    app.UseSerilogRequestLogging();
    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");
    app.UseRateLimiter();
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application start-up failed");
}
finally
{
    Log.CloseAndFlush();
}