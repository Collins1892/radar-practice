using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IncidentsApi;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class GetIncidentsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public GetIncidentsTests(TestWebApplicationFactory factory)
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
    public async Task Get_NoFilters_Returns200WithPagedResult()
    {
        // Arrange
        var reportedDate = DateTime.UtcNow.Date;
        var incident = new Incident
        {
            Id = 1,
            Title = "Spill in corridor B",
            Description = "Water on floor near supplies",
            Location = "Building 2, level 1",
            Severity = IncidentSeverity.Medium,
            Status = IncidentStatus.Open,
            ReportedDate = reportedDate,
        };
        var pagedResult = new PagedIncidentsResult(
            new[] { incident },
            Page: 1,
            PageSize: 25,
            TotalCount: 1,
            TotalPages: 1);

        var repo = Substitute.For<IIncidentRepository>();
        repo.IsValidSortField(Arg.Any<string>()).Returns(true);
        repo.GetPaged(Arg.Any<IncidentListQuery>()).Returns(pagedResult);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/incidents");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(1, body.Page);
        Assert.Equal(25, body.PageSize);
        Assert.Equal(1, body.TotalCount);
        Assert.Equal(1, body.TotalPages);

        var item = Assert.Single(body.Items);
        Assert.Equal(1, item.Id);
        Assert.Equal("Spill in corridor B", item.Title);
        Assert.Equal("Water on floor near supplies", item.Description);
        Assert.Equal("Building 2, level 1", item.Location);
        Assert.Equal(IncidentSeverity.Medium, item.Severity);
        Assert.Equal(IncidentStatus.Open, item.Status);
        Assert.Equal(reportedDate, item.ReportedDate.Date);
    }

    [Fact]
    public async Task Get_NoIncidents_Returns200WithEmptyPagedResult()
    {
        // Arrange
        var pagedResult = new PagedIncidentsResult(
            Array.Empty<Incident>(),
            Page: 1,
            PageSize: 25,
            TotalCount: 0,
            TotalPages: 0);

        var repo = Substitute.For<IIncidentRepository>();
        repo.IsValidSortField(Arg.Any<string>()).Returns(true);
        repo.GetPaged(Arg.Any<IncidentListQuery>()).Returns(pagedResult);
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/incidents");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(1, body.Page);
        Assert.Equal(25, body.PageSize);
        Assert.Equal(0, body.TotalCount);
        Assert.Equal(0, body.TotalPages);
        Assert.NotNull(body.Items);
        Assert.Empty(body.Items);
    }

    [Fact]
    public async Task Get_FilterBySeverity_ReturnsOnlyMatchingIncidents()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var high = await CreateIncidentAsync(
            client, "High severity", "Desc", "Ward 1",
            IncidentSeverity.High, IncidentStatus.Open, reportedDate);
        var low = await CreateIncidentAsync(
            client, "Low severity", "Desc", "Ward 2",
            IncidentSeverity.Low, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?severity=Low&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Contains(body.Items, i => i.Id == low.Id);
        Assert.DoesNotContain(body.Items, i => i.Id == high.Id);
        Assert.Equal(IncidentSeverity.Low, body.Items.Single(i => i.Id == low.Id).Severity);
    }

    [Fact]
    public async Task Get_FilterByStatus_ReturnsOnlyMatchingIncidents()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var open = await CreateIncidentAsync(
            client, "Open incident", "Desc", "Ward 1",
            IncidentSeverity.Medium, IncidentStatus.Open, reportedDate);
        var resolved = await CreateIncidentAsync(
            client, "Resolved incident", "Desc", "Ward 2",
            IncidentSeverity.Medium, IncidentStatus.Resolved, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?status=Resolved&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Contains(body.Items, i => i.Id == resolved.Id);
        Assert.DoesNotContain(body.Items, i => i.Id == open.Id);
        Assert.Equal(IncidentStatus.Resolved, body.Items.Single(i => i.Id == resolved.Id).Status);
    }

    [Fact]
    public async Task Get_InvalidSeverityQuery_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/incidents?severity=99");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid severity value.", body.Error);
    }

    [Fact]
    public async Task Get_InvalidStatusQuery_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/incidents?status=99");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid status value.", body.Error);
    }

    [Fact]
    public async Task Get_DefaultSort_ReturnsReportedDateDescending()
    {
        // Arrange
        var client = CreateDefaultClient();
        var oldest = await CreateIncidentAsync(
            client, "Oldest", "Desc", "Ward 1",
            IncidentSeverity.Low, IncidentStatus.Open, new DateTime(2026, 1, 1));
        var middle = await CreateIncidentAsync(
            client, "Middle", "Desc", "Ward 2",
            IncidentSeverity.Medium, IncidentStatus.Open, new DateTime(2026, 3, 1));
        var newest = await CreateIncidentAsync(
            client, "Newest", "Desc", "Ward 3",
            IncidentSeverity.High, IncidentStatus.Open, new DateTime(2026, 6, 1));

        // Act
        var response = await client.GetAsync("/incidents?pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        var orderedIds = body.Items
            .Where(i => i.Id == newest.Id || i.Id == middle.Id || i.Id == oldest.Id)
            .Select(i => i.Id)
            .ToArray();
        Assert.Equal(new[] { newest.Id, middle.Id, oldest.Id }, orderedIds);
    }

    [Fact]
    public async Task Get_SortByTitle_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var alpha = await CreateIncidentAsync(
            client, "Alpha", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var bravo = await CreateIncidentAsync(
            client, "Bravo", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var charlie = await CreateIncidentAsync(
            client, "Charlie", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=title&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { alpha.Id, bravo.Id, charlie.Id }, FilterOrderedIds(body, alpha.Id, bravo.Id, charlie.Id));
    }

    [Fact]
    public async Task Get_SortByTitle_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var alpha = await CreateIncidentAsync(
            client, "Alpha", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var bravo = await CreateIncidentAsync(
            client, "Bravo", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var charlie = await CreateIncidentAsync(
            client, "Charlie", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=title&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { charlie.Id, bravo.Id, alpha.Id }, FilterOrderedIds(body, charlie.Id, bravo.Id, alpha.Id));
    }

    [Fact]
    public async Task Get_SortByDescription_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var first = await CreateIncidentAsync(
            client, "Title A", "First", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var second = await CreateIncidentAsync(
            client, "Title B", "Second", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var third = await CreateIncidentAsync(
            client, "Title C", "Third", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=description&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { first.Id, second.Id, third.Id }, FilterOrderedIds(body, first.Id, second.Id, third.Id));
    }

    [Fact]
    public async Task Get_SortByDescription_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var first = await CreateIncidentAsync(
            client, "Title A", "First", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var second = await CreateIncidentAsync(
            client, "Title B", "Second", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var third = await CreateIncidentAsync(
            client, "Title C", "Third", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=description&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { third.Id, second.Id, first.Id }, FilterOrderedIds(body, third.Id, second.Id, first.Id));
    }

    [Fact]
    public async Task Get_SortByLocation_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var alpha = await CreateIncidentAsync(
            client, "Title", "Desc", "Alpha ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var bravo = await CreateIncidentAsync(
            client, "Title", "Desc", "Bravo ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var charlie = await CreateIncidentAsync(
            client, "Title", "Desc", "Charlie ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=location&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { alpha.Id, bravo.Id, charlie.Id }, FilterOrderedIds(body, alpha.Id, bravo.Id, charlie.Id));
    }

    [Fact]
    public async Task Get_SortByLocation_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var alpha = await CreateIncidentAsync(
            client, "Title", "Desc", "Alpha ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var bravo = await CreateIncidentAsync(
            client, "Title", "Desc", "Bravo ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var charlie = await CreateIncidentAsync(
            client, "Title", "Desc", "Charlie ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=location&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { charlie.Id, bravo.Id, alpha.Id }, FilterOrderedIds(body, charlie.Id, bravo.Id, alpha.Id));
    }

    [Fact]
    public async Task Get_SortBySeverity_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var low = await CreateIncidentAsync(
            client, "Low", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var medium = await CreateIncidentAsync(
            client, "Medium", "Desc", "Ward", IncidentSeverity.Medium, IncidentStatus.Open, reportedDate);
        var high = await CreateIncidentAsync(
            client, "High", "Desc", "Ward", IncidentSeverity.High, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=severity&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { low.Id, medium.Id, high.Id }, FilterOrderedIds(body, low.Id, medium.Id, high.Id));
    }

    [Fact]
    public async Task Get_SortBySeverity_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var low = await CreateIncidentAsync(
            client, "Low", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var medium = await CreateIncidentAsync(
            client, "Medium", "Desc", "Ward", IncidentSeverity.Medium, IncidentStatus.Open, reportedDate);
        var high = await CreateIncidentAsync(
            client, "High", "Desc", "Ward", IncidentSeverity.High, IncidentStatus.Open, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=severity&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { high.Id, medium.Id, low.Id }, FilterOrderedIds(body, high.Id, medium.Id, low.Id));
    }

    [Fact]
    public async Task Get_SortByStatus_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var open = await CreateIncidentAsync(
            client, "Open", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var inProgress = await CreateIncidentAsync(
            client, "InProgress", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.InProgress, reportedDate);
        var resolved = await CreateIncidentAsync(
            client, "Resolved", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Resolved, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=status&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { open.Id, inProgress.Id, resolved.Id }, FilterOrderedIds(body, open.Id, inProgress.Id, resolved.Id));
    }

    [Fact]
    public async Task Get_SortByStatus_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var open = await CreateIncidentAsync(
            client, "Open", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var inProgress = await CreateIncidentAsync(
            client, "InProgress", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.InProgress, reportedDate);
        var resolved = await CreateIncidentAsync(
            client, "Resolved", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Resolved, reportedDate);

        // Act
        var response = await client.GetAsync("/incidents?sortBy=status&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { resolved.Id, inProgress.Id, open.Id }, FilterOrderedIds(body, resolved.Id, inProgress.Id, open.Id));
    }

    [Fact]
    public async Task Get_SortByReportedDate_Asc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var oldest = await CreateIncidentAsync(
            client, "Oldest", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, new DateTime(2026, 1, 1));
        var middle = await CreateIncidentAsync(
            client, "Middle", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, new DateTime(2026, 3, 1));
        var newest = await CreateIncidentAsync(
            client, "Newest", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, new DateTime(2026, 6, 1));

        // Act
        var response = await client.GetAsync("/incidents?sortBy=reportedDate&sortDirection=asc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { oldest.Id, middle.Id, newest.Id }, FilterOrderedIds(body, oldest.Id, middle.Id, newest.Id));
    }

    [Fact]
    public async Task Get_SortByReportedDate_Desc()
    {
        // Arrange
        var client = CreateDefaultClient();
        var oldest = await CreateIncidentAsync(
            client, "Oldest", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, new DateTime(2026, 1, 1));
        var middle = await CreateIncidentAsync(
            client, "Middle", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, new DateTime(2026, 3, 1));
        var newest = await CreateIncidentAsync(
            client, "Newest", "Desc", "Ward", IncidentSeverity.Low, IncidentStatus.Open, new DateTime(2026, 6, 1));

        // Act
        var response = await client.GetAsync("/incidents?sortBy=reportedDate&sortDirection=desc&pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(new[] { newest.Id, middle.Id, oldest.Id }, FilterOrderedIds(body, newest.Id, middle.Id, oldest.Id));
    }

    [Fact]
    public async Task Get_InvalidSortBy_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/incidents?sortBy=invalidfield");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Invalid sort field.", body.Error);
    }

    [Fact]
    public async Task Get_PageSizeOver100_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/incidents?pageSize=101");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Page size must be 100 or fewer.", body.Error);
    }

    [Fact]
    public async Task Get_PageLessThan1_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/incidents?page=0");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Page must be at least 1.", body.Error);
    }

    [Fact]
    public async Task Get_InvalidSortDirection_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/incidents?sortDirection=random");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Sort direction must be asc or desc.", body.Error);
    }

    [Fact]
    public async Task Get_PageSizeLessThan1_Returns400WithError()
    {
        // Arrange
        var client = CreateDefaultClient();

        // Act
        var response = await client.GetAsync("/incidents?pageSize=0");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("Page size must be at least 1.", body.Error);
    }

    [Fact]
    public async Task Get_SoftDeletedIncidents_ExcludedFromResults()
    {
        // Arrange
        var client = CreateDefaultClient();
        var reportedDate = DateTime.UtcNow.Date;
        var kept = await CreateIncidentAsync(
            client, "Kept incident", "Desc", "Ward 1",
            IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var deleted = await CreateIncidentAsync(
            client, "Deleted incident", "Desc", "Ward 2",
            IncidentSeverity.Low, IncidentStatus.Open, reportedDate);
        var deleteResponse = await client.DeleteAsync($"/incidents/{deleted.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Act
        var response = await client.GetAsync("/incidents?pageSize=100");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<PagedIncidentsResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Contains(body.Items, i => i.Id == kept.Id);
        Assert.DoesNotContain(body.Items, i => i.Id == deleted.Id);
    }

    [Fact]
    public async Task Get_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        var repo = Substitute.For<IIncidentRepository>();
        repo.IsValidSortField(Arg.Any<string>()).Returns(true);
        repo.GetPaged(Arg.Any<IncidentListQuery>())
            .Throws(new InvalidOperationException("Simulated failure"));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/incidents");

        // Assert
        var raw = await response.Content.ReadAsStringAsync();
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = JsonSerializer.Deserialize<ErrorResponse>(raw, JsonOptions);
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Simulated failure", raw);
    }

    private static int[] FilterOrderedIds(PagedIncidentsResponse body, params int[] ids) =>
        body.Items.Where(i => ids.Contains(i.Id)).Select(i => i.Id).ToArray();

    private static async Task<IncidentResponse> CreateIncidentAsync(
        HttpClient client,
        string title,
        string description,
        string location,
        IncidentSeverity severity,
        IncidentStatus status,
        DateTime reportedDate)
    {
        var response = await client.PostAsJsonAsync(
            "/incidents",
            new
            {
                title,
                description,
                location,
                severity,
                status,
                reportedDate,
            },
            JsonOptions);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var incident = await response.Content.ReadFromJsonAsync<IncidentResponse>(JsonOptions);
        Assert.NotNull(incident);
        return incident;
    }
}
