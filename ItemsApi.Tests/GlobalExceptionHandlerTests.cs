using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;

public class GlobalExceptionHandlerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public GlobalExceptionHandlerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UnhandledException_Returns500WithGenericError()
    {
        // Arrange
        var client = _factory.WithWebHostBuilder(builder =>
            builder.Configure(app =>
            {
                app.UseExceptionHandler(errorApp =>
                    errorApp.Run(async ctx =>
                    {
                        ctx.Response.StatusCode = 500;
                        ctx.Response.ContentType = "application/json";
                        await ctx.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred." });
                    }));
                app.Map("/throw", branch =>
                    branch.Run(_ => throw new InvalidOperationException("boom")));
            }))
            .CreateClient();

        // Act
        var response = await client.GetAsync("/throw");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
    }

    private record ErrorResponse(string Error);
}
