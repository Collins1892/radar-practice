using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class GetItemsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public GetItemsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateDefaultClient() => _factory.CreateClient();

    private HttpClient CreateClientWithRepo(IItemsRepository repo) =>
        _factory.WithWebHostBuilder(b =>
            b.ConfigureServices(s => s.AddSingleton(repo)))
        .CreateClient();

    [Fact]
    public async Task Get_NoItems_ReturnsEmptyArray()
    {
        // Arrange
        var repo = Substitute.For<IItemsRepository>();
        repo.GetAll().Returns(Array.Empty<Item>());
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/items");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<Item[]>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task Get_WithTwoItems_ReturnsBothItems()
    {
        // Arrange
        var repo = Substitute.For<IItemsRepository>();
        repo.GetAll().Returns(new[]
        {
            new Item(1, "Widget", 9.99m),
            new Item(2, "Sprocket", 4.50m),
        });
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/items");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<Item[]>();
        Assert.NotNull(items);
        Assert.Equal(2, items.Length);
        Assert.Contains(items, i => i.Name == "Widget" && i.Price == 9.99m);
        Assert.Contains(items, i => i.Name == "Sprocket" && i.Price == 4.50m);
    }

    [Fact]
    public async Task Get_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        var repo = Substitute.For<IItemsRepository>();
        repo.GetAll().Throws(new InvalidOperationException("Simulated failure"));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/items");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Simulated failure", body.Error);
    }

    private record ErrorResponse(string Error);
}
