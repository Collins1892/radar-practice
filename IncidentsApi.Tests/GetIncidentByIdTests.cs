using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IncidentsApi;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class GetIncidentByIdTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public GetIncidentByIdTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

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
    public async Task Get_ById_NotFound_Returns404WithError()
    {
        // Arrange
        const int missingId = 999;
        var repo = Substitute.For<IIncidentRepository>();
        repo.GetById(missingId).Returns((Incident?)null);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync($"/incidents/{missingId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Incident not found.", body.Error);
    }

    [Fact]
    public async Task Get_ById_Exists_Returns200WithIncident()
    {
        // Arrange
        const int id = 1;
        var reportedDate = DateTime.UtcNow.Date;
        var incident = new Incident(
            id,
            "Spill in corridor B",
            "Water on floor near supplies",
            "Building 2, level 1",
            IncidentSeverity.Medium,
            IncidentStatus.Open,
            reportedDate);

        var repo = Substitute.For<IIncidentRepository>();
        repo.GetById(id).Returns(incident);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync($"/incidents/{id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IncidentResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(id, body.Id);
        Assert.Equal("Spill in corridor B", body.Title);
        Assert.Equal("Water on floor near supplies", body.Description);
        Assert.Equal("Building 2, level 1", body.Location);
        Assert.Equal(IncidentSeverity.Medium, body.Severity);
        Assert.Equal(IncidentStatus.Open, body.Status);
        Assert.Equal(reportedDate, body.ReportedDate.Date);
    }

    [Fact]
    public async Task Get_ById_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        const int id = 1;
        var repo = Substitute.For<IIncidentRepository>();
        repo.GetById(id).Throws(new InvalidOperationException("Simulated failure"));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync($"/incidents/{id}");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Simulated failure", body.Error);
    }

    private record IncidentResponse(
        int Id,
        string Title,
        string Description,
        string Location,
        IncidentSeverity Severity,
        IncidentStatus Status,
        DateTime ReportedDate);

    private record ErrorResponse(string Error);
}
