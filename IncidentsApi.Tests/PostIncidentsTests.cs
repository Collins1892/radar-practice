using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using IncidentsApi;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class PostIncidentsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PostIncidentsTests(TestWebApplicationFactory factory)
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
    public async Task Post_ValidIncident_Returns201WithIncident()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;

        // Act
        var response = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate,
            });

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var incident = await response.Content.ReadFromJsonAsync<IncidentResponse>(JsonOptions);
        Assert.NotNull(incident);
        Assert.True(incident.Id > 0);
        Assert.Equal("Spill in corridor B", incident.Title);
        Assert.Equal("Water on floor near supplies", incident.Description);
        Assert.Equal("Building 2, level 1", incident.Location);
        Assert.Equal(IncidentSeverity.Medium, incident.Severity);
        Assert.Equal(IncidentStatus.Open, incident.Status);
        Assert.Equal(reportedDate, incident.ReportedDate.Date);
    }

    [Fact]
    public async Task Post_BlankTitle_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = "",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title is required.", body.Error);
    }

    [Fact]
    public async Task Post_FutureReportedDate_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var futureReportedDate = DateTime.UtcNow.Date.AddDays(1);

        // Act
        var response = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = futureReportedDate,
            });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Reported date must not be in the future.", body.Error);
    }

    [Fact]
    public async Task Post_TitleOver50Chars_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var longTitle = new string('x', 51);

        // Act
        var response = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = longTitle,
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title must be 50 characters or fewer.", body.Error);
    }

    [Fact]
    public async Task Post_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        var repo = Substitute.For<IIncidentRepository>();
        repo.Add(Arg.Any<Incident>())
            .Throws(new InvalidOperationException("Incident limit reached."));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            });

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Incident limit reached.", body.Error);
    }

    [Fact]
    public async Task Post_InvalidSeverity_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");
        var json = $$"""
            {
              "title": "Spill in corridor B",
              "description": "Water on floor near supplies",
              "location": "Building 2, level 1",
              "severity": 99,
              "status": 0,
              "reportedDate": "{{reportedDate}}"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/incidents", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid severity value.", body.Error);
    }

    [Fact]
    public async Task Post_InvalidStatus_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");
        var json = $$"""
            {
              "title": "Spill in corridor B",
              "description": "Water on floor near supplies",
              "location": "Building 2, level 1",
              "severity": 1,
              "status": 99,
              "reportedDate": "{{reportedDate}}"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/incidents", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid status value.", body.Error);
    }

    [Fact]
    public async Task Post_MissingTitle_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");
        var json = $$"""
            {
              "description": "Water on floor near supplies",
              "location": "Building 2, level 1",
              "severity": 1,
              "status": 0,
              "reportedDate": "{{reportedDate}}"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/incidents", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title is required.", body.Error);
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
