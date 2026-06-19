using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuditsApi;
using AuditsApi.Models;
using AuditsApi.Repositories;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class GetAuditsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public GetAuditsTests(TestWebApplicationFactory factory)
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
    public async Task Get_NoFilters_Returns200WithPagedResult()
    {
        // Arrange
        var auditDate = new DateTime(2026, 6, 1);
        var audit = new Audit
        {
            Id = 1,
            Title = "Hand Hygiene Compliance",
            Description = "Ward 4B audit",
            AuditDate = auditDate,
            Status = Status.Scheduled,
            CreatedBy = "audit.user",
        };
        var pagedResult = new PagedAuditsResult(
            new[] { audit },
            Page: 1,
            PageSize: 25,
            TotalCount: 1,
            TotalPages: 1);

        var repo = Substitute.For<IAuditRepository>();
        repo.IsValidSortField(Arg.Any<string>()).Returns(true);
        repo.GetAll(Arg.Any<AuditListQuery>()).Returns(pagedResult);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/audits");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(1, body.Page);
        Assert.Equal(25, body.PageSize);
        Assert.Equal(1, body.TotalCount);
        Assert.Equal(1, body.TotalPages);

        var item = Assert.Single(body.Items);
        Assert.Equal(1, item.Id);
        Assert.Equal("Hand Hygiene Compliance", item.Title);
        Assert.Equal("Ward 4B audit", item.Description);
        Assert.Equal(auditDate, item.AuditDate.Date);
        Assert.Equal(Status.Scheduled, item.Status);
        Assert.Equal("audit.user", item.CreatedBy);
    }

    [Fact]
    public async Task Get_NoAudits_Returns200WithEmptyPagedResult()
    {
        // Arrange
        var pagedResult = new PagedAuditsResult(
            Array.Empty<Audit>(),
            Page: 1,
            PageSize: 25,
            TotalCount: 0,
            TotalPages: 0);

        var repo = Substitute.For<IAuditRepository>();
        repo.IsValidSortField(Arg.Any<string>()).Returns(true);
        repo.GetAll(Arg.Any<AuditListQuery>()).Returns(pagedResult);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/audits");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(1, body.Page);
        Assert.Equal(25, body.PageSize);
        Assert.Equal(0, body.TotalCount);
        Assert.Equal(0, body.TotalPages);
        Assert.NotNull(body.Items);
        Assert.Empty(body.Items);
    }

    [Fact]
    public async Task Get_FilterByStatus_ReturnsOnlyMatchingAudits()
    {
        // Arrange
        var scheduled = new Audit
        {
            Id = 1,
            Title = "Scheduled audit",
            Description = "First",
            AuditDate = new DateTime(2026, 1, 1),
            Status = Status.Scheduled,
            CreatedBy = "user.one",
            RecordStatus = RecordStatus.Active,
        };
        var pagedResult = new PagedAuditsResult(
            new[] { scheduled },
            Page: 1,
            PageSize: 100,
            TotalCount: 1,
            TotalPages: 1);

        var repo = Substitute.For<IAuditRepository>();
        repo.IsValidSortField(Arg.Any<string>()).Returns(true);
        repo.GetAll(Arg.Is<AuditListQuery>(q =>
                q.Status == Status.Scheduled && q.PageSize == 100))
            .Returns(pagedResult);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/audits?status=Scheduled&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Contains(body.Items, i => i.Id == scheduled.Id);
        Assert.All(body.Items, i => Assert.Equal(Status.Scheduled, i.Status));
        Assert.Single(body.Items);
    }

    [Fact]
    public async Task Get_InvalidStatusQuery_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/audits?status=99");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal(
            "Status must be one of: Scheduled, InProgress, Completed, Cancelled.",
            body.Error);
    }

    [Fact]
    public async Task Get_DefaultSort_ReturnsAuditDateDescending()
    {
        // Arrange
        var client = CreateDefaultClient();
        var oldest = await CreateAuditAsync(
            client,
            "Oldest",
            "Desc",
            new DateTime(2026, 1, 1),
            Status.Scheduled,
            "user.one");
        var middle = await CreateAuditAsync(
            client,
            "Middle",
            "Desc",
            new DateTime(2026, 3, 1),
            Status.InProgress,
            "user.two");
        var newest = await CreateAuditAsync(
            client,
            "Newest",
            "Desc",
            new DateTime(2026, 6, 1),
            Status.Completed,
            "user.three");

        // Act
        var response = await client.GetAsync("/audits?pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        var orderedTitles = body.Items
            .Where(i => i.Id == newest.Id || i.Id == middle.Id || i.Id == oldest.Id)
            .Select(i => i.Id)
            .ToArray();
        Assert.Equal(new[] { newest.Id, middle.Id, oldest.Id }, orderedTitles);
    }

    [Fact]
    public async Task Get_SortByTitle_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var alpha = await CreateAuditAsync(
            client, "Alpha", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var bravo = await CreateAuditAsync(
            client, "Bravo", "Desc", new DateTime(2026, 2, 1), Status.Scheduled, "user");
        var charlie = await CreateAuditAsync(
            client, "Charlie", "Desc", new DateTime(2026, 3, 1), Status.Scheduled, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=title&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { alpha.Id, bravo.Id, charlie.Id }, FilterOrderedIds(body, alpha.Id, bravo.Id, charlie.Id));
    }

    [Fact]
    public async Task Get_SortByTitle_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var alpha = await CreateAuditAsync(
            client, "Alpha", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var bravo = await CreateAuditAsync(
            client, "Bravo", "Desc", new DateTime(2026, 2, 1), Status.Scheduled, "user");
        var charlie = await CreateAuditAsync(
            client, "Charlie", "Desc", new DateTime(2026, 3, 1), Status.Scheduled, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=title&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { charlie.Id, bravo.Id, alpha.Id }, FilterOrderedIds(body, charlie.Id, bravo.Id, alpha.Id));
    }

    [Fact]
    public async Task Get_SortByDescription_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var first = await CreateAuditAsync(
            client, "Title A", "First", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var second = await CreateAuditAsync(
            client, "Title B", "Second", new DateTime(2026, 2, 1), Status.Scheduled, "user");
        var third = await CreateAuditAsync(
            client, "Title C", "Third", new DateTime(2026, 3, 1), Status.Scheduled, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=description&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { first.Id, second.Id, third.Id }, FilterOrderedIds(body, first.Id, second.Id, third.Id));
    }

    [Fact]
    public async Task Get_SortByDescription_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var first = await CreateAuditAsync(
            client, "Title A", "First", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var second = await CreateAuditAsync(
            client, "Title B", "Second", new DateTime(2026, 2, 1), Status.Scheduled, "user");
        var third = await CreateAuditAsync(
            client, "Title C", "Third", new DateTime(2026, 3, 1), Status.Scheduled, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=description&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { third.Id, second.Id, first.Id }, FilterOrderedIds(body, third.Id, second.Id, first.Id));
    }

    [Fact]
    public async Task Get_SortByAuditDate_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var oldest = await CreateAuditAsync(
            client, "Oldest", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var middle = await CreateAuditAsync(
            client, "Middle", "Desc", new DateTime(2026, 3, 1), Status.Scheduled, "user");
        var newest = await CreateAuditAsync(
            client, "Newest", "Desc", new DateTime(2026, 6, 1), Status.Scheduled, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=auditDate&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { oldest.Id, middle.Id, newest.Id }, FilterOrderedIds(body, oldest.Id, middle.Id, newest.Id));
    }

    [Fact]
    public async Task Get_SortByAuditDate_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var oldest = await CreateAuditAsync(
            client, "Oldest", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var middle = await CreateAuditAsync(
            client, "Middle", "Desc", new DateTime(2026, 3, 1), Status.Scheduled, "user");
        var newest = await CreateAuditAsync(
            client, "Newest", "Desc", new DateTime(2026, 6, 1), Status.Scheduled, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=auditDate&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { newest.Id, middle.Id, oldest.Id }, FilterOrderedIds(body, newest.Id, middle.Id, oldest.Id));
    }

    [Fact]
    public async Task Get_SortByStatus_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var scheduled = await CreateAuditAsync(
            client, "Scheduled", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var inProgress = await CreateAuditAsync(
            client, "InProgress", "Desc", new DateTime(2026, 2, 1), Status.InProgress, "user");
        var completed = await CreateAuditAsync(
            client, "Completed", "Desc", new DateTime(2026, 3, 1), Status.Completed, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=status&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { scheduled.Id, inProgress.Id, completed.Id }, FilterOrderedIds(body, scheduled.Id, inProgress.Id, completed.Id));
    }

    [Fact]
    public async Task Get_SortByStatus_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var scheduled = await CreateAuditAsync(
            client, "Scheduled", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "user");
        var inProgress = await CreateAuditAsync(
            client, "InProgress", "Desc", new DateTime(2026, 2, 1), Status.InProgress, "user");
        var completed = await CreateAuditAsync(
            client, "Completed", "Desc", new DateTime(2026, 3, 1), Status.Completed, "user");

        // Act
        var response = await client.GetAsync("/audits?sortBy=status&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { completed.Id, inProgress.Id, scheduled.Id }, FilterOrderedIds(body, completed.Id, inProgress.Id, scheduled.Id));
    }

    [Fact]
    public async Task Get_SortByCreatedBy_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var alice = await CreateAuditAsync(
            client, "Title", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "alice");
        var bob = await CreateAuditAsync(
            client, "Title", "Desc", new DateTime(2026, 2, 1), Status.Scheduled, "bob");
        var carol = await CreateAuditAsync(
            client, "Title", "Desc", new DateTime(2026, 3, 1), Status.Scheduled, "carol");

        // Act
        var response = await client.GetAsync("/audits?sortBy=createdBy&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { alice.Id, bob.Id, carol.Id }, FilterOrderedIds(body, alice.Id, bob.Id, carol.Id));
    }

    [Fact]
    public async Task Get_SortByCreatedBy_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var alice = await CreateAuditAsync(
            client, "Title", "Desc", new DateTime(2026, 1, 1), Status.Scheduled, "alice");
        var bob = await CreateAuditAsync(
            client, "Title", "Desc", new DateTime(2026, 2, 1), Status.Scheduled, "bob");
        var carol = await CreateAuditAsync(
            client, "Title", "Desc", new DateTime(2026, 3, 1), Status.Scheduled, "carol");

        // Act
        var response = await client.GetAsync("/audits?sortBy=createdBy&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { carol.Id, bob.Id, alice.Id }, FilterOrderedIds(body, carol.Id, bob.Id, alice.Id));
    }

    [Fact]
    public async Task Get_InvalidSortBy_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/audits?sortBy=invalidfield");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid sort field.", body.Error);
    }

    [Fact]
    public async Task Get_InvalidSortDirection_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/audits?sortDirection=random");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Sort direction must be asc or desc.", body.Error);
    }

    [Fact]
    public async Task Get_PageLessThan1_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/audits?page=0");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Page must be at least 1.", body.Error);
    }

    [Fact]
    public async Task Get_PageSizeLessThan1_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/audits?pageSize=0");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Page size must be at least 1.", body.Error);
    }

    [Fact]
    public async Task Get_PageSizeOver100_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/audits?pageSize=101");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Page size must be 100 or fewer.", body.Error);
    }

    [Fact]
    public async Task Get_SoftDeletedAudits_ExcludedFromResults()
    {
        // Arrange
        var client = CreateDefaultClient();
        var kept = await CreateAuditAsync(
            client,
            "Kept audit",
            "Desc",
            new DateTime(2026, 1, 1),
            Status.Scheduled,
            "user.one");
        var deleted = await CreateAuditAsync(
            client,
            "Deleted audit",
            "Desc",
            new DateTime(2026, 2, 1),
            Status.Scheduled,
            "user.two");
        var deleteResponse = await client.DeleteAsync($"/audits/{deleted.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Act
        var response = await client.GetAsync("/audits?pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedAuditsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Contains(body.Items, i => i.Id == kept.Id);
        Assert.DoesNotContain(body.Items, i => i.Id == deleted.Id);
    }

    [Fact]
    public async Task Get_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        var repo = Substitute.For<IAuditRepository>();
        repo.IsValidSortField(Arg.Any<string>()).Returns(true);
        repo.GetAll(Arg.Any<AuditListQuery>())
            .Throws(new InvalidOperationException("Simulated failure"));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/audits");

        // Assert
        var raw = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = JsonSerializer.Deserialize<ErrorResponse>(raw, JsonOptions);
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Simulated failure", raw);
    }

    private static int[] FilterOrderedIds(PagedAuditsResponse body, params int[] ids) =>
        body.Items.Where(i => ids.Contains(i.Id)).Select(i => i.Id).ToArray();

    private static async Task<AuditResponse> CreateAuditAsync(
        HttpClient client,
        string title,
        string description,
        DateTime auditDate,
        Status status,
        string createdBy)
    {
        var response = await client.PostAsJsonAsync(
            "/audits",
            new
            {
                title,
                description,
                auditDate,
                status,
                createdBy,
            },
            JsonOptions);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var audit = await response.Content.ReadFromJsonAsync<AuditResponse>(JsonOptions);
        Assert.NotNull(audit);
        return audit;
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
        string CreatedBy);

    private record ErrorResponse(string Error);
}
