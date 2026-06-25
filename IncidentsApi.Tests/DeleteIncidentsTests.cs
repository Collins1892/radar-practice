using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IncidentsApi;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

public class DeleteIncidentsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public DeleteIncidentsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateDefaultClient() => _factory.CreateClient();

    private HttpClient CreateClientWithRepo(IIncidentRepository repo) =>
        _factory.WithWebHostBuilder(b =>
            b.ConfigureServices(s => s.AddSingleton(repo)))
        .CreateClient();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task Delete_ExistingActiveIncident_Returns204AndExcludesFromGetByIdAndGetAll()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var createResponse = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = "To be deleted",
                description = "Desc",
                location = "Ward 1",
                severity = IncidentSeverity.Low,
                status = IncidentStatus.Open,
                reportedDate,
            },
            JsonOptions);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<IncidentResponse>(JsonOptions);
        Assert.NotNull(created);

        // Act
        var response = await client.DeleteAsync($"/incidents/{created.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getByIdResponse = await client.GetAsync($"/incidents/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getByIdResponse.StatusCode);

        var listResponse = await client.GetAsync("/incidents");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var listBody = await listResponse.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(listBody);
        Assert.DoesNotContain(listBody.Items, i => i.Id == created.Id);
    }

    [Fact]
    public async Task Delete_NotFound_Returns404WithError()
    {
        // Arrange
        const int missingId = 999;
        var repo = Substitute.For<IIncidentRepository>();
        repo.SoftDelete(missingId).Returns(false);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.DeleteAsync($"/incidents/{missingId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Incident not found.", body.Error);
    }

    [Fact]
    public async Task Delete_AlreadyDeleted_Returns404Not204()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var createResponse = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = "To be deleted twice",
                description = "Desc",
                location = "Ward 1",
                severity = IncidentSeverity.Low,
                status = IncidentStatus.Open,
                reportedDate,
            },
            JsonOptions);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<IncidentResponse>(JsonOptions);
        Assert.NotNull(created);
        var firstDelete = await client.DeleteAsync($"/incidents/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, firstDelete.StatusCode);

        // Act
        var response = await client.DeleteAsync($"/incidents/{created.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Incident not found.", body.Error);
    }
}
