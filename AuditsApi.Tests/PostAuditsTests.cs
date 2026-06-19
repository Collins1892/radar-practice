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

public class PostAuditsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public PostAuditsTests(TestWebApplicationFactory factory)
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
    public async Task Post_ValidAudit_Returns201WithLocationAndResponseBody()
    {
        // Arrange
        var client = CreateDefaultClient();
        var auditDate = new DateTime(2026, 6, 1);

        // Act
        var response = await client.PostAsJsonAsync(
            "/audits",
            new
            {
                title = "Hand Hygiene Compliance",
                description = "Ward 4B audit",
                auditDate,
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var audit = await response.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(audit);
        Assert.True(audit.Id > 0);
        Assert.Equal($"/audits/{audit.Id}", response.Headers.Location?.ToString());
        Assert.Equal("Hand Hygiene Compliance", audit.Title);
        Assert.Equal("Ward 4B audit", audit.Description);
        Assert.Equal(auditDate, audit.AuditDate.Date);
        Assert.Equal(Status.Scheduled, audit.Status);
        Assert.Equal("audit.user", audit.CreatedBy);
    }

    [Fact]
    public async Task Post_RecordStatusInJsonBody_Ignored_NotExposedInResponse()
    {
        // Arrange
        var client = CreateDefaultClient();
        var json = """
            {
              "title": "Hand Hygiene Compliance",
              "description": "Ward 4B audit",
              "auditDate": "2026-06-01",
              "status": "Scheduled",
              "createdBy": "audit.user",
              "recordStatus": "Deleted"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/audits", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("recordStatus", raw, StringComparison.OrdinalIgnoreCase);
        var audit = await response.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(audit);
        Assert.True(audit.Id > 0);
    }

    [Fact]
    public async Task Post_NullPayload_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.PostAsync(
            "/audits",
            JsonContent.Create<AuditRequest?>(null));

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit payload is required.", body.Error);
    }

    [Fact]
    public async Task Post_MissingTitle_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var json = """
            {
              "description": "Ward 4B audit",
              "auditDate": "2026-06-01",
              "status": "Scheduled",
              "createdBy": "audit.user"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/audits", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Title is required.", body.Error);
    }

    [Fact]
    public async Task Post_TitleOver200Chars_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var longTitle = new string('x', 201);

        // Act
        var response = await client.PostAsJsonAsync(
            "/audits",
            new
            {
                title = longTitle,
                description = "Ward 4B audit",
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
    public async Task Post_MissingStatus_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var json = """
            {
              "title": "Hand Hygiene Compliance",
              "description": "Ward 4B audit",
              "auditDate": "2026-06-01",
              "status": null,
              "createdBy": "audit.user"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/audits", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Status is required.", body.Error);
    }

    [Fact]
    public async Task Post_InvalidStatus_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var json = """
            {
              "title": "Hand Hygiene Compliance",
              "description": "Ward 4B audit",
              "auditDate": "2026-06-01",
              "status": 99,
              "createdBy": "audit.user"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/audits", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal(
            "Status must be one of: Scheduled, InProgress, Completed, Cancelled.",
            body.Error);
    }

    [Fact]
    public async Task Post_MissingAuditDate_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var json = """
            {
              "title": "Hand Hygiene Compliance",
              "description": "Ward 4B audit",
              "status": "Scheduled",
              "createdBy": "audit.user"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/audits", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("AuditDate is required.", body.Error);
    }

    [Fact]
    public async Task Post_MissingCreatedBy_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();
        var json = """
            {
              "title": "Hand Hygiene Compliance",
              "description": "Ward 4B audit",
              "auditDate": "2026-06-01",
              "status": "Scheduled"
            }
            """;
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/audits", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("CreatedBy is required.", body.Error);
    }

    [Fact]
    public async Task Post_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        var repo = Substitute.For<IAuditRepository>();
        repo.Add(Arg.Any<Audit>())
            .Throws(new InvalidOperationException("Audit limit reached."));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.PostAsJsonAsync(
            "/audits",
            new
            {
                title = "Hand Hygiene Compliance",
                description = "Ward 4B audit",
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
        Assert.DoesNotContain("Audit limit reached.", raw);
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
