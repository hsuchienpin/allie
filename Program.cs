var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// The game park serves files only. Game state and artwork stay on the device.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    context.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' blob: data:; connect-src 'self'; worker-src 'self'; " +
        "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'";
    if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
    {
        context.Response.StatusCode = StatusCodes.Status405MethodNotAllowed;
        context.Response.Headers.Allow = "GET, HEAD";
        return;
    }
    await next();
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.Run();
