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
        var incident = new Incident(
            1,
            "Spill in corridor B",
            "Water on floor near supplies",
            "Building 2, level 1",
            IncidentSeverity.Medium,
            IncidentStatus.Open,
            reportedDate);
        var pagedResult = new PagedIncidentsResult(
            new[] { incident },
            Page: 1,
            PageSize: 25,
            TotalCount: 1,
            TotalPages: 1);

        var repo = Substitute.For<IIncidentRepository>();
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
    public async Task Get_WhenRepositoryThrows_Returns500()
    {
        // Arrange
        var repo = Substitute.For<IIncidentRepository>();
        repo.GetPaged(Arg.Any<IncidentListQuery>())
            .Throws(new InvalidOperationException("Simulated failure"));
        var client = CreateClientWithRepo(repo);

        // Act
        var response = await client.GetAsync("/incidents");

        // Assert
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
        Assert.NotNull(body);
        Assert.Equal("An unexpected error occurred.", body.Error);
        Assert.DoesNotContain("Simulated failure", body.Error);
    }

    private record PagedIncidentsResponse(
        IncidentResponse[] Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);

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
