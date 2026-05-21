using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

public class PostItemsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public PostItemsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_ValidItem_Returns201WithItem()
    {
        var response = await _client.PostAsJsonAsync("/items", new { name = "Sprocket", price = 7.50m });

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
        var response = await _client.PostAsJsonAsync("/items", new { name = "", price = 1.00m });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Name is required.", body.Error);
    }

    [Fact]
    public async Task Post_NameOver100Chars_Returns400WithError()
    {
        var longName = new string('x', 101);

        var response = await _client.PostAsJsonAsync("/items", new { name = longName, price = 1.00m });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Name must be under 100 characters.", body.Error);
    }

    private record ItemResponse(int Id, string Name, decimal Price);
    private record ErrorResponse(string Error);
}
