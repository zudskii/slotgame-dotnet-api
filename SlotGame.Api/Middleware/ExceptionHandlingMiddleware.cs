using System.Net;
using System.Text.Json;
using SlotGame.Infrastructure;

namespace SlotGame.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }

        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            PlayerNotFoundException =>
                (HttpStatusCode.NotFound, exception.Message),

            InsufficientBalanceException =>
                (HttpStatusCode.BadRequest, exception.Message),

            _ =>
                (HttpStatusCode.InternalServerError, exception.Message)
        };

        _logger.LogError(
            exception,
            "Unhandled exception on {Path}",
            context.Request.Path
        );

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(new
            {
                error = message,
                type = exception.GetType().Name
            })
        );
    }
}