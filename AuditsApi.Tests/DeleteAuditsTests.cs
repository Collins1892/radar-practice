using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuditsApi.Models;
using AuditsApi.Repositories;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

public class DeleteAuditsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public DeleteAuditsTests(TestWebApplicationFactory factory)
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
    public async Task Delete_ExistingActiveAudit_Returns204AndExcludesFromGetByIdAndGetAll()
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

        // Act
        var response = await client.DeleteAsync($"/audits/{created.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getByIdResponse = await client.GetAsync($"/audits/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getByIdResponse.StatusCode);

        var listResponse = await client.GetAsync("/audits");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        var listBody = await listResponse.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(listBody);
        Assert.DoesNotContain(listBody.Items, i => i.Id == created.Id);
    }

    [Fact]
    public async Task Delete_NotFound_Returns404WithError()
    {
        // Arrange
        const int missingId = 999;
        var repo = Substitute.For<IAuditRepository>();
        repo.SoftDelete(missingId).Returns(false);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.DeleteAsync($"/audits/{missingId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit not found.", body.Error);
    }

    [Fact]
    public async Task Delete_AlreadyDeleted_Returns404Not204()
    {
        // Arrange
        var client = CreateDefaultClient();
        var createResponse = await client.PostAsJsonAsync(
            "/audits",
            new
            {
                title = "To be deleted twice",
                description = "Desc",
                auditDate = new DateTime(2026, 6, 1),
                status = Status.Scheduled,
                createdBy = "audit.user",
            },
            JsonOptions);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(created);
        var firstDelete = await client.DeleteAsync($"/audits/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, firstDelete.StatusCode);

        // Act
        var response = await client.DeleteAsync($"/audits/{created.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Audit not found.", body.Error);
    }

    private record PagedAuditsResponse(
        AuditResponse[] Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);

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
