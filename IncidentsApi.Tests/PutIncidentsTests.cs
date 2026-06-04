using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IncidentsApi;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class PutIncidentsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PutIncidentsTests(TestWebApplicationFactory factory)
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
    public async Task Put_ById_NotFound_Returns404WithError()
    {
        // Arrange
        const int missingId = 999;
        var repo = Substitute.For<IIncidentRepository>();
        repo.Update(Arg.Any<Incident>()).Returns((Incident?)null);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{missingId}",
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
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Incident not found.", body.Error);
    }

    [Fact]
    public async Task Put_ById_ValidData_Returns200WithUpdatedIncident()
    {
        // Arrange
        const int id = 1;
        var reportedDate = DateTime.UtcNow.Date;
        var updatedIncident = new Incident(
            id,
            "Updated spill report",
            "Floor dried and signs placed",
            "Building 2, level 2",
            IncidentSeverity.High,
            IncidentStatus.Resolved,
            reportedDate);

        var repo = Substitute.For<IIncidentRepository>();
        repo.Update(Arg.Any<Incident>()).Returns(updatedIncident);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                title = "Updated spill report",
                description = "Floor dried and signs placed",
                location = "Building 2, level 2",
                severity = IncidentSeverity.High,
                status = IncidentStatus.Resolved,
                reportedDate,
            });

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<IncidentResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(id, body.Id);
        Assert.Equal("Updated spill report", body.Title);
        Assert.Equal("Floor dried and signs placed", body.Description);
        Assert.Equal("Building 2, level 2", body.Location);
        Assert.Equal(IncidentSeverity.High, body.Severity);
        Assert.Equal(IncidentStatus.Resolved, body.Status);
        Assert.Equal(reportedDate, body.ReportedDate.Date);
    }

    [Fact]
    public async Task Put_BlankTitle_Returns400WithError()
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
        repo.Update(Arg.Any<Incident>()).Returns(incident);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                title = "",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate,
            });

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title is required.", body.Error);
    }

    [Fact]
    public async Task Put_FutureReportedDate_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var reportedDate = DateTime.UtcNow.Date;
        var futureReportedDate = reportedDate.AddDays(1);
        var incident = new Incident(
            id,
            "Spill in corridor B",
            "Water on floor near supplies",
            "Building 2, level 1",
            IncidentSeverity.Medium,
            IncidentStatus.Open,
            reportedDate);

        var repo = Substitute.For<IIncidentRepository>();
        repo.Update(Arg.Any<Incident>()).Returns(incident);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
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
    public async Task Put_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        const int id = 1;
        var repo = Substitute.For<IIncidentRepository>();
        repo.Update(Arg.Any<Incident>())
            .Throws(new InvalidOperationException("Update failed."));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
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
        Assert.DoesNotContain("Update failed.", body.Error);
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
