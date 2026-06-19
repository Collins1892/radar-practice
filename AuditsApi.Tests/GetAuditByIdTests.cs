using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuditsApi.Models;
using AuditsApi.Repositories;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class GetAuditByIdTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public GetAuditByIdTests(TestWebApplicationFactory factory)
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
    public async Task Get_ById_Exists_Returns200WithAudit()
    {
        // Arrange
        var client = CreateDefaultClient();
        var auditDate = new DateTime(2026, 6, 1);
        var createResponse = await client.PostAsJsonAsync(
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
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(created);

        // Act
        var response = await client.GetAsync($"/audits/{created.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(created.Id, body.Id);
        Assert.Equal("Hand Hygiene Compliance", body.Title);
        Assert.Equal("Ward 4B audit", body.Description);
        Assert.Equal(auditDate, body.AuditDate.Date);
        Assert.Equal(Status.Scheduled, body.Status);
        Assert.Equal("audit.user", body.CreatedBy);
        Assert.Equal(RecordStatus.Active, body.RecordStatus);
    }

    [Fact]
    public async Task Get_ById_NotFound_Returns404WithError()
    {
        // Arrange
        const int missingId = 999;
        var repo = Substitute.For<IAuditRepository>();
        repo.GetById(missingId).Returns((Audit?)null);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync($"/audits/{missingId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit not found.", body.Error);
    }

    [Fact]
    public async Task Get_ById_SoftDeleted_Returns404WithError()
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
        var response = await client.GetAsync($"/audits/{created.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit not found.", body.Error);
    }

    [Fact]
    public async Task Get_ById_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        const int id = 1;
        var repo = Substitute.For<IAuditRepository>();
        repo.GetById(id).Throws(new InvalidOperationException("Simulated failure"));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync($"/audits/{id}");

        // Assert
        var raw = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = JsonSerializer.Deserialize<ErrorResponse>(raw, JsonOptions);
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Simulated failure", raw);
    }

    private record AuditResponse(
        int Id,
        string Title,
        string Description,
        DateTime AuditDate,
        Status Status,
        string CreatedBy,
        RecordStatus RecordStatus);

    private record ErrorResponse(string Error);
}
