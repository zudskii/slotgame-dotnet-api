using System.Net;
using System.Text.Json;
using SlotGame.Infrastructure;

namespace SlotGame.Api.Middleware;

public sealed class ExceptionHandlingMiddleware {
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware>_logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger) {
        _next=next;
        _logger=logger;
    }

    public async Task InvokeAsync(HttpContext context) {
        try {
            await _next(context);
        }

        catch (Exception ex) {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception) {
        var (statusCode, message)=exception switch {
            PlayerNotFoundException=>(HttpStatusCode.NotFound, exception.Message),
            InsufficientBalanceException=>(HttpStatusCode.BadRequest, exception.Message),
            _=>(HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        }

        ;

        // ⚠️ Full exception (with stack trace) ᲘᲚᲝᲒᲔᲑᲐ სერვერზე ყოველთვის —
        // client კი მხოლოდ safe, generic message-ს იღებს 500-ის შემთხვევაში.
        if (statusCode==HttpStatusCode.InternalServerError) {
            _logger.LogError(exception, "Unhandled exception on {Path}", context.Request.Path);
        }

        else {
            _logger.LogWarning("{ExceptionType}: {Message} on {Path}",
                exception.GetType().Name, exception.Message, context.Request.Path);
        }

        context.Response.ContentType="application/json";
        context.Response.StatusCode=(int)statusCode;

        var payload=JsonSerializer.Serialize(new {
                error=message
            });
        await context.Response.WriteAsync(payload);
    }
}