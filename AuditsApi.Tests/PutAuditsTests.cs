using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuditsApi;
using AuditsApi.Models;
using AuditsApi.Repositories;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class PutAuditsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PutAuditsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateDefaultClient() => _factory.CreateClient();

    private HttpClient CreateClientWithRepo(IAuditRepository repo) =>
        _factory.WithWebHostBuilder(b =>
            b.ConfigureServices(s => s.AddSingleton(repo)))
        .CreateClient();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task Put_ValidUpdate_Returns200WithUpdatedFields()
    {
        // Arrange
        var client = CreateDefaultClient();
        var auditDate = new DateTime(2026, 6, 1);
        var createResponse = await client.PostAsJsonAsync(
            "/audits",
            new
            {
                title = "Initial title",
                description = "Initial description",
                auditDate,
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(created);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{created.Id}",
            new
            {
                id = created.Id,
                title = "Updated title",
                description = "Updated description",
                auditDate = new DateTime(2026, 7, 1),
                status = Status.InProgress,
                createdBy = "updated.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(created.Id, body.Id);
        Assert.Equal("Updated title", body.Title);
        Assert.Equal("Updated description", body.Description);
        Assert.Equal(new DateTime(2026, 7, 1), body.AuditDate.Date);
        Assert.Equal(Status.InProgress, body.Status);
        Assert.Equal("updated.user", body.CreatedBy);
    }

    [Fact]
    public async Task Put_RouteIdMismatch_Returns400WithError()
    {
        // Arrange
        const int routeId = 1;
        const int bodyId = 2;
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{routeId}",
            new
            {
                id = bodyId,
                title = "Updated title",
                description = "Updated description",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Route id does not match audit id.", body.Error);
    }

    [Fact]
    public async Task Put_NullPayload_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var repo = Substitute.For<IAuditRepository>();
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsync(
            $"/audits/{id}",
            JsonContent.Create<PutAuditRequest?>(null));

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit payload is required.", body.Error);
        repo.DidNotReceive().Update(Arg.Any<Audit>());
    }

    [Fact]
    public async Task Put_InvalidAuditId_Returns400WithError()
    {
        // Arrange
        const int id = 0;
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{id}",
            new
            {
                id,
                title = "Updated title",
                description = "Updated description",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("A valid audit id is required.", body.Error);
    }

    [Fact]
    public async Task Put_MissingTitle_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{id}",
            new
            {
                id,
                title = "",
                description = "Updated description",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title is required.", body.Error);
    }

    [Fact]
    public async Task Put_TitleOver200Chars_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var longTitle = new string('x', 201);
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{id}",
            new
            {
                id,
                title = longTitle,
                description = "Updated description",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title must not exceed 200 characters.", body.Error);
    }

    [Fact]
    public async Task Put_MissingStatus_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());
        var json = $$"""
            {
              "id": {{id}},
              "title": "Updated title",
              "description": "Updated description",
              "auditDate": "2026-06-01",
              "status": null,
              "createdBy": "audit.user"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync($"/audits/{id}", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Status is required.", body.Error);
    }

    [Fact]
    public async Task Put_InvalidStatus_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());
        var json = $$"""
            {
              "id": {{id}},
              "title": "Updated title",
              "description": "Updated description",
              "auditDate": "2026-06-01",
              "status": 99,
              "createdBy": "audit.user"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync($"/audits/{id}", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal(
            "Status must be one of: Scheduled, InProgress, Completed, Cancelled.",
            body.Error);
    }

    [Fact]
    public async Task Put_MissingAuditDate_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());
        var json = $$"""
            {
              "id": {{id}},
              "title": "Updated title",
              "description": "Updated description",
              "status": "Scheduled",
              "createdBy": "audit.user"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync($"/audits/{id}", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("AuditDate is required.", body.Error);
    }

    [Fact]
    public async Task Put_MissingCreatedBy_Returns400WithError()
    {
        // Arrange
        const int id = 1;
        var client = CreateClientWithRepo(Substitute.For<IAuditRepository>());
        var json = $$"""
            {
              "id": {{id}},
              "title": "Updated title",
              "description": "Updated description",
              "auditDate": "2026-06-01",
              "status": "Scheduled"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PutAsync($"/audits/{id}", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("CreatedBy is required.", body.Error);
    }

    [Fact]
    public async Task Put_ById_NotFound_Returns404WithError()
    {
        // Arrange
        const int missingId = 999;
        var repo = Substitute.For<IAuditRepository>();
        repo.Update(Arg.Any<Audit>()).Returns((Audit?)null);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{missingId}",
            new
            {
                id = missingId,
                title = "Updated title",
                description = "Updated description",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit not found.", body.Error);
    }

    [Fact]
    public async Task Put_SoftDeletedAudit_Returns404WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var createResponse = await client.PostAsJsonAsync(
            "/audits",
            new
            {
                title = "To be deleted",
                description = "Desc",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(created);
        var deleteResponse = await client.DeleteAsync($"/audits/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{created.Id}",
            new
            {
                id = created.Id,
                title = "Updated title",
                description = "Updated description",
                auditDate = new DateTime(2026, 7, 1),
                status = Status.InProgress,
                createdBy = "updated.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit not found.", body.Error);
    }

    [Fact]
    public async Task Put_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        const int id = 1;
        var repo = Substitute.For<IAuditRepository>();
        repo.Update(Arg.Any<Audit>())
            .Throws(new InvalidOperationException("Update failed."));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PutAsJsonAsync(
            $"/audits/{id}",
            new
            {
                id,
                title = "Updated title",
                description = "Updated description",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
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

    private record AuditResponse(
        int Id,
        string Title,
        string Description,
        DateTime AuditDate,
        Status Status,
        string CreatedBy);

    private record ErrorResponse(string Error);
}
