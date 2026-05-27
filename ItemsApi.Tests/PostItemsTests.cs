using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class PostItemsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PostItemsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private HttpClient CreateDefaultClient() => _factory.CreateClient();

    private HttpClient CreateClientWithRepo(IItemsRepository repo) =>
        _factory.WithWebHostBuilder(b =>
            b.ConfigureServices(s => s.AddSingleton(repo)))
        .CreateClient();

    [Fact]
    public async Task Post_ValidItem_Returns201WithItem()
    {
        var client = CreateDefaultClient();

        var response = await client.PostAsJsonAsync("/items", new { name = "Sprocket", price = 7.50m });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var item = await response.Content.ReadFromJsonAsync<ItemResponse>();
        Assert.NotNull(item);
        Assert.Equal("Sprocket", item.Name);
        Assert.Equal(7.50m, item.Price);
        Assert.True(item.Id > 0);
    }

    [Fact]
    public async Task Post_EmptyName_Returns400WithError()
    {
        var client = CreateDefaultClient();

        var response = await client.PostAsJsonAsync("/items", new { name = "", price = 1.00m });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Name is required.", body.Error);
    }

    [Fact]
    public async Task Post_NameOver100Chars_Returns400WithError()
    {
        var client = CreateDefaultClient();
        var longName = new string('x', 101);

        var response = await client.PostAsJsonAsync("/items", new { name = longName, price = 1.00m });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Name must be under 100 characters.", body.Error);
    }

    [Fact]
    public async Task Post_ZeroPrice_Returns400WithError()
    {
        var client = CreateDefaultClient();

        var response = await client.PostAsJsonAsync("/items", new { name = "Widget", price = 0.00m });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Price must be greater than zero.", body.Error);
    }

    [Fact]
    public async Task Post_NegativePrice_Returns400WithError()
    {
        var client = CreateDefaultClient();

        var response = await client.PostAsJsonAsync("/items", new { name = "Widget", price = -1.00m });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Price must be greater than zero.", body.Error);
    }

    [Fact]
    public async Task Post_WhenRepositoryThrows_Returns500()
    {
        var repo = Substitute.For<IItemsRepository>();
        repo.Add(Arg.Any<string>(), Arg.Any<decimal>())
            .Throws(new InvalidOperationException("Item limit reached."));
        var client = CreateClientWithRepo(repo);

        var response = await client.PostAsJsonAsync("/items", new { name = "Widget", price = 1.00m });

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task Get_WhenRepositoryThrows_Returns500()
    {
        var repo = Substitute.For<IItemsRepository>();
        repo.GetAll().Throws(new Exception("Simulated failure"));
        var client = CreateClientWithRepo(repo);

        var response = await client.GetAsync("/items");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task Post_WhitespaceOnlyName_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.PostAsJsonAsync("/items", new { name = "   ", price = 1.00m });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Name is required.", body.Error);
    }

    [Fact]
    public async Task Post_NameExactly100Chars_Returns201WithItem()
    {
        // Arrange
        var client = CreateDefaultClient();
        var name = new string('x', 100);

        // Act
        var response = await client.PostAsJsonAsync("/items", new { name, price = 1.00m });

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<ItemResponse>();
        Assert.NotNull(item);
        Assert.Equal(100, item.Name.Length);
        Assert.Equal(1.00m, item.Price);
        Assert.True(item.Id > 0);
    }

    private record ItemResponse(int Id, string Name, decimal Price);
    private record ErrorResponse(string Error);
}
