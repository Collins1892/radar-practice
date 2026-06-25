using System.Net;
using System.Net.Http.Json;
using System.Text;
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
                id = missingId,
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

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
        var updatedIncident = new Incident
        {
            Id = id,
            Title = "Updated spill report",
            Description = "Floor dried and signs placed",
            Location = "Building 2, level 2",
            Severity = IncidentSeverity.High,
            Status = IncidentStatus.Resolved,
            ReportedDate = reportedDate,
        };

        var repo = Substitute.For<IIncidentRepository>();
        repo.Update(Arg.Any<Incident>()).Returns(updatedIncident);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "Updated spill report",
                description = "Floor dried and signs placed",
                location = "Building 2, level 2",
                severity = IncidentSeverity.High,
                status = IncidentStatus.Resolved,
                reportedDate,
            },
            JsonOptions);

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
    public async Task Put_RouteIdMismatch_Returns400WithError()
    {
        // Arrange
        const int routeId = 1;
        const int bodyId = 2;
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{routeId}",
            new
            {
                id = bodyId,
                title = "Updated spill report",
                description = "Floor dried and signs placed",
                location = "Building 2, level 2",
                severity = IncidentSeverity.High,
                status = IncidentStatus.Resolved,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Route id does not match incident id.", body.Error);
    }

    [Fact]
    public async Task Put_NullPayload_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var repo = Substitute.For<IIncidentRepository>();
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsync(
            $"/incidents/{id}",
            JsonContent.Create<PutIncidentRequest?>(null));

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Incident payload is required.", body.Error);
        repo.DidNotReceive().Update(Arg.Any<Incident>());
    }

    [Fact]
    public async Task Put_InvalidIncidentId_Returns400WithError()
    {
        // Arrange
        const int id = 0;
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "Updated spill report",
                description = "Floor dried and signs placed",
                location = "Building 2, level 2",
                severity = IncidentSeverity.High,
                status = IncidentStatus.Resolved,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("A valid incident id is required.", body.Error);
    }

    [Fact]
    public async Task Put_BlankTitle_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title is required.", body.Error);
    }

    [Fact]
    public async Task Put_TitleOver50Chars_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var longTitle = new string('x', 51);
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = longTitle,
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title must be 50 characters or fewer.", body.Error);
    }

    [Fact]
    public async Task Put_BlankDescription_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "Spill in corridor B",
                description = "",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Description is required.", body.Error);
    }

    [Fact]
    public async Task Put_DescriptionOver100Chars_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var longDescription = new string('x', 101);
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "Spill in corridor B",
                description = longDescription,
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Description must be 100 characters or fewer.", body.Error);
    }

    [Fact]
    public async Task Put_BlankLocation_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = "",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Location is required.", body.Error);
    }

    [Fact]
    public async Task Put_LocationOver100Chars_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var longLocation = new string('x', 101);
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = longLocation,
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Location must be 100 characters or fewer.", body.Error);
    }

    [Fact]
    public async Task Put_InvalidSeverity_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());
        var reportedDate = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");
        var json = $$"""
            {
              "id": {{id}},
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
        var response = await client.PutAsync($"/incidents/{id}", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid severity value.", body.Error);
    }

    [Fact]
    public async Task Put_InvalidStatus_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());
        var reportedDate = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");
        var json = $$"""
            {
              "id": {{id}},
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
        var response = await client.PutAsync($"/incidents/{id}", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid status value.", body.Error);
    }

    [Fact]
    public async Task Put_FutureReportedDate_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var futureReportedDate = DateTime.UtcNow.Date.AddDays(1);
        var client = CreateClientWithRepo(Substitute.For<IIncidentRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{id}",
            new
            {
                id,
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = futureReportedDate,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Reported date must not be in the future.", body.Error);
    }

    [Fact]
    public async Task Put_SoftDeletedIncident_Returns404WithError()
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
        var deleteResponse = await client.DeleteAsync($"/incidents/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/incidents/{created.Id}",
            new
            {
                id = created.Id,
                title = "Updated report",
                description = "Updated description",
                location = "Ward 2",
                severity = IncidentSeverity.High,
                status = IncidentStatus.Resolved,
                reportedDate,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Incident not found.", body.Error);
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
                id,
                title = "Spill in corridor B",
                description = "Water on floor near supplies",
                location = "Building 2, level 1",
                severity = IncidentSeverity.Medium,
                status = IncidentStatus.Open,
                reportedDate = DateTime.UtcNow.Date,
            },
            JsonOptions);

        // Assert
        var raw = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = JsonSerializer.Deserialize<ErrorResponse>(raw, JsonOptions);
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Update failed.", raw);
    }

    [Fact]
    public async Task Put_ExistingIncident_PersistsUpdatedValuesInDatabase()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;

        var createResponse = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title = "Initial report",
                description = "Initial description",
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
        var response = await client.PutAsJsonAsync(
            $"/incidents/{created.Id}",
            new
            {
                id = created.Id,
                title = "Updated report",
                description = "Updated description",
                location = "Ward 2",
                severity = IncidentSeverity.High,
                status = IncidentStatus.Resolved,
                reportedDate,
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<IncidentResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(created.Id, body.Id);
        Assert.Equal("Updated report", body.Title);
        Assert.Equal("Updated description", body.Description);
        Assert.Equal("Ward 2", body.Location);
        Assert.Equal(IncidentSeverity.High, body.Severity);
        Assert.Equal(IncidentStatus.Resolved, body.Status);
        Assert.Equal(reportedDate, body.ReportedDate.Date);
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
