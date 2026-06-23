---
name: dotnet-test-writer
description: Write integration tests for the .NET 8 minimal APIs in this project (ItemsApi, IncidentsApi, and AuditsApi). Use when the user asks to write, add, generate, or create an integration test for any of these APIs. One [Fact] per request. Uses xUnit 2.5.3, the project's custom TestWebApplicationFactory (SQLite-backed), NSubstitute 5.1.0, the [Fact] attribute, and Arrange/Act/Assert comments. Run dotnet test <Project>.Tests/<Project>.Tests.csproj after adding or changing a test. Confirm the suite passes before declaring done. Calibrate effort: think hard for mock/exception paths, fixture isolation, new endpoints, any IncidentsApi or AuditsApi filter/sort/paginate or PUT round-trip test, or AuditsApi DELETE soft-delete tests.
---

# .NET Test Writer

Guides writing integration tests for all three .NET 8 minimal APIs in this project: `ItemsApi`, `IncidentsApi`, and `AuditsApi`. Each API has its own test project, factory, and DbContext — treat them as separate concerns.

## Core rules

- **One test per request.** Write one `[Fact]` at a time — not a batch. Offer the next test separately.
- **Run tests and confirm pass.** After any change to ItemsApi tests, run `dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj`. After any change to IncidentsApi tests, run `dotnet test IncidentsApi.Tests/IncidentsApi.Tests.csproj`. After any change to AuditsApi tests, run `dotnet test AuditsApi.Tests/AuditsApi.Tests.csproj`. Confirm the suite passes before declaring done.
- **Use Context7** when you need to verify current xUnit or NSubstitute API details:
  1. `mcp__context7__resolve-library-id` with library name + question
  2. `mcp__context7__query-docs` with the resolved ID

## Recommended effort level

Calibrate reasoning depth to the test scenario:

| Situation | Guidance |
|-----------|----------|
| NSubstitute exception paths, scoped DI vs mock override, or shared-fixture persistence ordering | **think hard** |
| New endpoint file, custom status/body shape, or GlobalExceptionHandler behaviour | **think hard** |
| Any IncidentsApi filter, sort, paginate, or PUT round-trip test | **think hard** |
| Any AuditsApi filter, sort, paginate, PUT round-trip, or DELETE soft-delete test | **think hard** |
| Happy-path GET/POST or single validation 400 following existing `[Fact]` patterns | Standard effort — no extra keyword |

When **think hard** applies, read [Mocking with NSubstitute](#mocking-with-nsubstitute) and [Database and isolation gotchas](#database-and-isolation-gotchas) before choosing `CreateDefaultClient()` vs `CreateClientWithRepo()`. Do not over-mock persistence tests or over-assert DB-generated ids.

## Tech stack

| Library | Version |
|---------|---------|
| xUnit | 2.5.3 |
| NSubstitute | 5.1.0 |
| Microsoft.AspNetCore.Mvc.Testing | 8.0.0 |
| Microsoft.EntityFrameworkCore.Sqlite | 8.0.27 |
| Microsoft.EntityFrameworkCore.Design | 8.0.27 (ItemsApi only) |
| Microsoft.Data.Sqlite | 8.0.27 (transitive via EFCore.Sqlite; used directly in TestWebApplicationFactory) |
| Target framework | .NET 8.0 |

The test projects reference `Microsoft.EntityFrameworkCore.Sqlite` (8.0.27), and each `TestWebApplicationFactory` uses `Microsoft.Data.Sqlite` directly (`SqliteConnection`) for its in-memory database.

The `Xunit` namespace is globally imported (via `<Using Include="Xunit" />` in each csproj) — no `using Xunit;` needed.

## Project layout

### ItemsApi

```
ItemsApi/
  Program.cs                  — GET /items and POST /items endpoints; registers CORS,
                                AddDbContext<AppDbContext> (SQLite "app.db"),
                                AddScoped<IItemsRepository, EfItemsRepository>, and
                                runs Database.Migrate() on startup
  IItemsRepository.cs         — interface: GetAll(), Add(string name, decimal price) returns Item
  Item.cs                     — record Item(int Id, string Name, decimal Price); EF-mapped entity
                                (DbSet<Item>), Price persisted via HasConversion<string>(),
                                Name capped at HasMaxLength(100) in AppDbContext.OnModelCreating
  ItemRequest.cs              — record ItemRequest(string Name, decimal Price)
  Data/AppDbContext.cs        — DbContext with DbSet<Item> and model configuration
  Repositories/EfItemsRepository.cs — EF Core implementation of IItemsRepository
  Migrations/                 — EF migrations (initial: 20260601041641_InitialCreate)

ItemsApi.Tests/
  TestWebApplicationFactory.cs — custom factory; per-class in-memory SQLite DB via AppDbContext
  PostItemsTests.cs           — POST /items tests (file already exists)
  GlobalExceptionHandlerTests.cs
  GetItemsTests.cs            — GET /items tests (file already exists — append new [Fact] before private records)
```

### IncidentsApi

```
IncidentsApi/
  Program.cs                  — GET /incidents, POST /incidents, GET /incidents/{id},
                                PUT /incidents/{id} endpoints; registers CORS,
                                AddDbContext<IncidentsDbContext> (SQLite "incidents.db"),
                                AddScoped<IIncidentRepository, EfIncidentRepository>,
                                JsonStringEnumConverter (enums serialised as strings in JSON),
                                global exception handler, and runs Database.Migrate() on startup
  IIncidentRepository.cs      — interface: GetPaged(query), GetById(id), Add(incident), Update(incident)
  Incident.cs                 — record Incident(int Id, string Title, string Description,
                                string Location, IncidentSeverity Severity, IncidentStatus Status,
                                DateTime ReportedDate); also declares IncidentSeverity and
                                IncidentStatus enums (stored as int in DB)
  IncidentRequest.cs          — record IncidentRequest(string Title, string Description,
                                string Location, IncidentSeverity Severity,
                                IncidentStatus Status, DateTime ReportedDate)
  IncidentListQuery.cs        — record IncidentListQuery(IncidentSeverity? Severity,
                                IncidentStatus? Status, string SortBy, bool SortDescending,
                                int Page, int PageSize)
  PagedIncidentsResult.cs     — record PagedIncidentsResult(IReadOnlyList<Incident> Items,
                                int Page, int PageSize, int TotalCount, int TotalPages)
  Data/IncidentsDbContext.cs  — dedicated DbContext for incidents.db; enums stored as int
  Repositories/EfIncidentRepository.cs — EF Core implementation of IIncidentRepository
  Migrations/                 — EF migrations (initial: 20260604060010_InitialCreate)

IncidentsApi.Tests/
  TestWebApplicationFactory.cs — custom factory; per-class in-memory SQLite DB via IncidentsDbContext
  GetIncidentsTests.cs        — GET /incidents tests (exists — append new [Fact] before private records)
  PostIncidentsTests.cs       — POST /incidents tests (exists — append new [Fact] before private records)
  GetIncidentByIdTests.cs     — GET /incidents/{id} tests (exists — append new [Fact] before private records)
  PutIncidentsTests.cs        — PUT /incidents/{id} tests (exists — append new [Fact] before private records)
```

### AuditsApi

```
AuditsApi/
  Program.cs                  — GET /audits, POST /audits, GET /audits/{id},
                                PUT /audits/{id}, DELETE /audits/{id} endpoints; registers CORS,
                                AddDbContext<AuditsDbContext> (SQLite "audits.db"),
                                AddScoped<IAuditRepository, EfAuditRepository>,
                                JsonStringEnumConverter (enums serialised as strings in JSON),
                                global exception handler, and runs Database.Migrate() on startup
  Repositories/IAuditRepository.cs — interface: GetAll(query), GetById(id), Add(audit),
                                Update(audit), SoftDelete(id), IsValidSortField(sortBy)
  Models/Audit.cs             — entity with Title, Description, AuditDate, Status, CreatedBy,
                                RecordStatus (soft delete — not on wire DTOs)
  Models/Status.cs            — enum: Scheduled, InProgress, Completed, Cancelled (stored as int in DB)
  Models/RecordStatus.cs      — enum: Active, Deleted (stored as int; never on wire DTOs)
  AuditRequest.cs             — POST wire DTO (no RecordStatus)
  PutAuditRequest.cs          — PUT wire DTO (includes Id; no RecordStatus)
  AuditResponse.cs            — response DTO (no RecordStatus)
  AuditListQuery.cs           — record AuditListQuery(Status? Status, string SortBy,
                                bool SortDescending, int Page, int PageSize)
  PagedAuditsResult.cs        — record PagedAuditsResult(IReadOnlyList<Audit> Items,
                                int Page, int PageSize, int TotalCount, int TotalPages)
  Data/AuditsDbContext.cs     — dedicated DbContext for audits.db; Status and RecordStatus stored as int
  Repositories/EfAuditRepository.cs — EF Core implementation; SoftDelete sets RecordStatus Deleted
  Migrations/                 — EF migrations (initial: 20260619033036_InitialCreate)

AuditsApi.Tests/
  TestWebApplicationFactory.cs — custom factory; per-class in-memory SQLite DB via AuditsDbContext
  GetAuditsTests.cs           — GET /audits tests (exists — append new [Fact] before private records)
  PostAuditsTests.cs          — POST /audits tests (exists — append new [Fact] before private records)
  GetAuditByIdTests.cs        — GET /audits/{id} tests (exists — append new [Fact] before private records)
  PutAuditsTests.cs           — PUT /audits/{id} tests (exists — append new [Fact] before private records)
  DeleteAuditsTests.cs        — DELETE /audits/{id} soft-delete tests (exists — append before private records)
```

## Test class structure (boilerplate)

### ItemsApi

All test classes follow this shape — no explicit namespace, private helper methods, private response records at the bottom:

```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class <FeatureName>Tests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public <FeatureName>Tests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateDefaultClient() => _factory.CreateClient();

    private HttpClient CreateClientWithRepo(IItemsRepository repo) =>
        _factory.WithWebHostBuilder(b =>
            b.ConfigureServices(s => s.AddSingleton(repo)))
        .CreateClient();

    [Fact]
    public async Task <MethodName>()
    {
        // Arrange
        ...

        // Act
        ...

        // Assert
        ...
    }

    private record ItemResponse(int Id, string Name, decimal Price);
    private record ErrorResponse(string Error);
}
```

Only include the private records the class actually uses.

### IncidentsApi

IncidentsApi test classes add a static `JsonOptions` field because enums are serialised as strings in the server's JSON responses (due to `JsonStringEnumConverter` in `Program.cs`) and must be deserialised with the same converter in tests:

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using IncidentsApi;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class <FeatureName>Tests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public <FeatureName>Tests(TestWebApplicationFactory factory)
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
    public async Task <MethodName>()
    {
        // Arrange
        ...

        // Act
        ...

        // Assert
        ...
    }

    private record IncidentResponse(
        int Id,
        string Title,
        string Description,
        string Location,
        IncidentSeverity Severity,
        IncidentStatus Status,
        DateTime ReportedDate);

    private record PagedIncidentsResponse(
        IncidentResponse[] Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);

    private record ErrorResponse(string Error);
}
```

Only include the private records the class actually uses. `PagedIncidentsResponse` is only needed in GET /incidents tests; `IncidentResponse` is used by POST, GET by id, and PUT tests.

Trim imports to what the class uses — `System.Text`, `System.Text.Json`, and `System.Text.Json.Serialization` are only needed for raw-JSON `StringContent` (invalid-enum) tests and `JsonOptions`.

### AuditsApi

AuditsApi test classes follow the same `JsonOptions` pattern as IncidentsApi. Use `using AuditsApi.Models` for `Status` and entity types; `using AuditsApi.Repositories` for `IAuditRepository`.

```csharp
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuditsApi.Models;
using AuditsApi.Repositories;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class <FeatureName>Tests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public <FeatureName>Tests(TestWebApplicationFactory factory)
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
    public async Task <MethodName>()
    {
        // Arrange
        ...

        // Act
        ...

        // Assert
        ...
    }

    private record AuditResponse(
        int Id,
        string Title,
        string Description,
        DateTime AuditDate,
        Status Status,
        string CreatedBy);

    private record PagedAuditsResponse(
        AuditResponse[] Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);

    private record ErrorResponse(string Error);
}
```

Only include the private records the class actually uses. `PagedAuditsResponse` is only needed in GET /audits tests; `AuditResponse` is used by POST, GET by id, and PUT tests. **Never** add `RecordStatus` to wire response records — it is not exposed in JSON.

## Naming convention

Format: `<HttpVerb>_<Scenario>_<ExpectedResult>`

**ItemsApi examples:**
- `Get_NoItems_ReturnsEmptyArray`
- `Get_WithTwoItems_ReturnsBothItems`
- `Get_WhenRepositoryThrows_Returns500`
- `Post_ValidItem_Returns201WithItem`
- `Post_EmptyName_Returns400WithError`
- `Post_WhenRepositoryThrows_Returns500`

**IncidentsApi examples:**
- `Get_NoFilters_Returns200WithPagedResult`
- `Get_NoIncidents_Returns200WithEmptyPagedResult`
- `Get_PageSizeOver100_Returns400WithError`
- `Get_InvalidSortBy_Returns400WithError`
- `Get_FilterBySeverity_ReturnsOnlyMatchingIncidents`
- `Get_WhenRepositoryThrows_Returns500`
- `Post_ValidIncident_Returns201WithIncident`
- `Post_BlankTitle_Returns400WithError`
- `Post_InvalidSeverity_Returns400WithError`
- `Post_WhenRepositoryThrows_Returns500`
- `Get_ById_Exists_Returns200WithIncident`
- `Get_ById_NotFound_Returns404WithError`
- `Put_ById_ValidData_Returns200WithUpdatedIncident`
- `Put_ExistingIncident_PersistsUpdatedValuesInDatabase`
- `Put_ById_NotFound_Returns404WithError`
- `Put_WhenRepositoryThrows_Returns500`

**AuditsApi examples:**
- `Get_NoFilters_Returns200WithPagedResult`
- `Get_NoAudits_Returns200WithEmptyPagedResult`
- `Get_FilterByStatus_ReturnsOnlyMatchingAudits`
- `Get_SoftDeletedAudits_ExcludedFromResults`
- `Get_PageSizeOver100_Returns400WithError`
- `Get_InvalidSortBy_Returns400WithError`
- `Get_WhenRepositoryThrows_Returns500`
- `Post_ValidAudit_Returns201WithLocationAndResponseBody`
- `Post_RecordStatusInJsonBody_Ignored_NotExposedInResponse`
- `Post_MissingTitle_Returns400WithError`
- `Post_InvalidStatus_Returns400WithError`
- `Post_WhenRepositoryThrows_Returns500`
- `Get_ById_Exists_Returns200WithAudit`
- `Get_ById_NotFound_Returns404WithError`
- `Get_ById_SoftDeleted_Returns404WithError`
- `Put_ValidUpdate_Returns200WithUpdatedFields`
- `Put_RouteIdMismatch_Returns400WithError`
- `Put_SoftDeletedAudit_Returns404WithError`
- `Put_ById_NotFound_Returns404WithError`
- `Delete_ExistingActiveAudit_Returns204AndExcludesFromGetByIdAndGetAll`
- `Delete_NotFound_Returns404WithError`
- `Delete_AlreadyDeleted_Returns404Not204`

## Arrange/Act/Assert pattern

Include the three comment markers, even when Arrange is minimal:

```csharp
[Fact]
public async Task Get_NoItems_ReturnsEmptyArray()
{
    // Arrange
    var repo = Substitute.For<IItemsRepository>();
    repo.GetAll().Returns(Array.Empty<Item>());
    var client = CreateClientWithRepo(repo);

    // Act
    var response = await client.GetAsync("/items");

    // Assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    var items = await response.Content.ReadFromJsonAsync<Item[]>();
    Assert.NotNull(items);
    Assert.Empty(items);
}
```

## Mocking with NSubstitute

### ItemsApi

**Use `CreateClientWithRepo(mock)` when the test needs to force specific `GetAll()` contents or simulate a repository exception. Use `CreateDefaultClient()` when the test exercises real persistence (create, round-trip read).**

`IClassFixture` gives the whole test class a single shared `TestWebApplicationFactory` instance. The real repository is `EfItemsRepository` (registered **scoped**), backed by an in-memory SQLite database that the factory creates per test class — a `SqliteConnection("DataSource=:memory:")` opened in the fixture constructor, kept open for the fixture's lifetime, migrated on host creation, and disposed at the end. Each test class therefore gets its own isolated database; data does **not** leak across classes. Data added within a class *does* persist across that class's `[Fact]`s (shared fixture), so a test that asserts the repo is empty or contains exactly N items via `CreateDefaultClient()` can be fragile within the class unless it owns the state.

`CreateClientWithRepo(repo)` overrides the EF repository with a fresh mock for that one client, so the test owns its data completely and runs correctly regardless of execution order.

`CreateDefaultClient()` runs against the real, isolated, migrated in-memory database — it is the right choice for persistence and round-trip behaviour (for example, posting an item and reading it back), as well as for validation errors (400) that never reach the repository.

```csharp
// Arrange — mock controls exactly what GetAll returns
var repo = Substitute.For<IItemsRepository>();
repo.GetAll().Returns(new[] { new Item(1, "Widget", 9.99m) });
var client = CreateClientWithRepo(repo);
```

For exception scenarios (requires `using NSubstitute.ExceptionExtensions;`):

```csharp
repo.Add(Arg.Any<string>(), Arg.Any<decimal>())
    .Throws(new InvalidOperationException("Item limit reached."));
```

### IncidentsApi

**Real-persistence tests are preferred for IncidentsApi over mocked tests wherever the goal is verifying data behaviour.** Apply this guidance:

| Goal | Client to use |
|------|---------------|
| Verify paged response shape or mock a controlled list | `CreateClientWithRepo(mock)` |
| Verify filter/sort/paginate behaviour against real data | `CreateDefaultClient()` — seed multiple records via POST, then query |
| POST happy path (201 + round-trip id) | `CreateDefaultClient()` |
| GET by id 200 with known data | `CreateClientWithRepo(mock)` with stubbed `GetById` return, or `CreateDefaultClient()` after POST for full-stack |
| PUT round-trip (assert update persisted) | `CreateDefaultClient()` — POST to create, PUT to update, assert PUT response body (optionally follow with GET to confirm persistence) |
| 500 exception path | `CreateClientWithRepo(mock)` — configure mock to `.Throws(...)` |
| 404 not-found | `CreateClientWithRepo(mock)` — configure `Update`/`GetById` to return `null` |
| Validation 400 that never reaches the repo | `CreateDefaultClient()` (or a bare mock — repo is never called) |

For filter/sort/paginate tests using real persistence, seed records with different field values via `PostAsJsonAsync`, then call the filtered/sorted/paginated URL and assert only the expected records are returned in the expected order. For example, seed two incidents with different severities, then `GET /incidents?severity=High` and assert only the matching incident is returned.

For PUT round-trip tests using real persistence: POST to create → PUT to update → assert PUT response body (optionally follow with GET to confirm persistence).

For exception scenarios, mock the `IIncidentRepository` interface method that the endpoint calls:

```csharp
var repo = Substitute.For<IIncidentRepository>();
repo.Add(Arg.Any<Incident>())
    .Throws(new InvalidOperationException("Incident limit reached."));
var client = CreateClientWithRepo(repo);
```

For `GetPaged` exceptions:

```csharp
repo.GetPaged(Arg.Any<IncidentListQuery>())
    .Throws(new InvalidOperationException("Simulated failure"));
```

**Invalid enum values** cannot be expressed via `PostAsJsonAsync` (the client-side serialiser can't produce out-of-range ints from a typed enum). Use raw JSON with `StringContent` instead:

```csharp
var json = $$"""
    {
      "title": "Test",
      "description": "Desc",
      "location": "Ward 1",
      "severity": 99,
      "status": 0,
      "reportedDate": "{{DateTime.UtcNow.Date:yyyy-MM-dd}}"
    }
    """;
using var content = new StringContent(json, Encoding.UTF8, "application/json");
var response = await client.PostAsync("/incidents", content);
```

### AuditsApi

**Real-persistence tests are preferred for AuditsApi over mocked tests wherever the goal is verifying data behaviour** — same guidance as IncidentsApi, plus soft-delete flows:

| Goal | Client to use |
|------|---------------|
| Verify paged response shape or mock a controlled list | `CreateClientWithRepo(mock)` |
| Verify filter/sort/paginate behaviour against real data | `CreateDefaultClient()` — seed via POST, then query |
| POST happy path (201 + round-trip id) | `CreateDefaultClient()` |
| GET by id 200 with known data | `CreateClientWithRepo(mock)` with stubbed `GetById`, or `CreateDefaultClient()` after POST |
| PUT round-trip (assert update persisted) | `CreateDefaultClient()` — POST to create, PUT to update, assert response |
| DELETE soft-delete round-trip | `CreateDefaultClient()` — POST → DELETE (204) → GET 404 and excluded from GET list |
| Assert `RecordStatus` never on wire | `CreateDefaultClient()` — POST with `recordStatus` in raw JSON; response must not include it |
| 500 exception path | `CreateClientWithRepo(mock)` — configure mock to `.Throws(...)` |
| 404 not-found / already soft-deleted | `CreateClientWithRepo(mock)` or `CreateDefaultClient()` after DELETE |
| Validation 400 that never reaches the repo | `CreateDefaultClient()` (or bare mock — repo never called) |

**Soft delete (`RecordStatus`):** `Add` always sets `Active`. `Update` and reads exclude `Deleted`. DELETE calls `SoftDelete` — second delete returns 404, not 204. Wire DTOs (`AuditRequest`, `PutAuditRequest`) and `AuditResponse` never include `RecordStatus`.

For `GetAll` exceptions:

```csharp
repo.IsValidSortField(Arg.Any<string>()).Returns(true);
repo.GetAll(Arg.Any<AuditListQuery>())
    .Throws(new InvalidOperationException("Simulated failure"));
```

For invalid enum values in POST/PUT, use raw JSON with `StringContent` (same pattern as IncidentsApi).

## Endpoint reference

### ItemsApi endpoints

#### GET /items
- **200** — returns `Item[]` (JSON array)
- **500** — repository throws

#### POST /items
- **201** — valid input; returns `{ id, name, price }`. The `id` is DB-generated (auto-increment), so assert `Id > 0` rather than a specific value. Decimal price precision is preserved on round-trip because `Price` is mapped via `HasConversion<string>()`.
- **400** `"Name is required."` — empty or whitespace name
- **400** `"Name must be under 100 characters."` — name > 100 chars
- **400** `"Price must be greater than zero."` — price ≤ 0
- **500** — repository throws

### IncidentsApi endpoints

#### GET /incidents
- **200** — paged result: `{ items, page, pageSize, totalCount, totalPages }`. Defaults: `sortBy=reportedDate`, `sortDirection=desc`, `page=1`, `pageSize=25`.
- **400** `"Page must be at least 1."` — `page < 1`
- **400** `"Page size must be at least 1."` — `pageSize < 1`
- **400** `"Page size must be 100 or fewer."` — `pageSize > 100`
- **400** `"Invalid sort field."` — `sortBy` not in `{title, description, location, severity, status, reporteddate}` (case-insensitive)
- **400** `"Sort direction must be asc or desc."` — `sortDirection` not `asc` or `desc` (case-insensitive)
- **400** `"Invalid severity value."` — out-of-range `severity` int passed as query param (supply as `?severity=99` — no raw JSON needed, unlike POST)
- **400** `"Invalid status value."` — out-of-range `status` int passed as query param (supply as `?status=99` — no raw JSON needed, unlike POST)
- **500** — repository throws; assert `"An unexpected error occurred."` AND `DoesNotContain` the internal exception message

#### POST /incidents
- **201** — valid input; returns created `Incident`. `Id` is DB-generated — assert `Id > 0`. Enums are returned as strings in the JSON response; deserialise with `JsonOptions`.
- **400** `"Title is required."` — blank/whitespace title
- **400** `"Title must be 50 characters or fewer."` — title > 50 chars
- **400** `"Description is required."` — blank/whitespace description
- **400** `"Description must be 100 characters or fewer."` — description > 100 chars
- **400** `"Location is required."` — blank/whitespace location
- **400** `"Location must be 100 characters or fewer."` — location > 100 chars
- **400** `"Invalid severity value."` — out-of-range severity (use raw JSON `StringContent`)
- **400** `"Invalid status value."` — out-of-range status (use raw JSON `StringContent`)
- **400** `"Reported date must not be in the future."` — `reportedDate` after `DateTime.UtcNow.Date`
- **500** — repository throws; assert `"An unexpected error occurred."` AND `DoesNotContain` the internal exception message

#### GET /incidents/{id}
- **200** — returns single `Incident` by id. Deserialise with `JsonOptions`.
- **404** `"Incident not found."` — id not in database

#### PUT /incidents/{id}
- **200** — valid input; returns updated `Incident`. Applies the same validation rules as POST. Deserialise with `JsonOptions`.
- **400** — same validation errors as POST
- **404** `"Incident not found."` — id not in database; `repo.Update(...)` returns `null`
- **500** — repository throws; assert `"An unexpected error occurred."` AND `DoesNotContain` the internal exception message

### AuditsApi endpoints

#### GET /audits
- **200** — paged result: `{ items, page, pageSize, totalCount, totalPages }`. Defaults: `sortBy=auditDate`, `sortDirection=desc`, `page=1`, `pageSize=25`. Soft-deleted rows excluded.
- **400** `"Page must be at least 1."` — `page < 1`
- **400** `"Page size must be at least 1."` — `pageSize < 1`
- **400** `"Page size must be 100 or fewer."` — `pageSize > 100`
- **400** `"Invalid sort field."` — invalid `sortBy` (use `repo.IsValidSortField` in production)
- **400** `"Sort direction must be asc or desc."`
- **400** `"Status must be one of: Scheduled, InProgress, Completed, Cancelled."` — invalid `status` query param
- **500** — repository throws; assert generic error message and no internal leak

#### POST /audits
- **201** — valid input; returns created `AuditResponse` with `Location` header `/audits/{id}`. `Id` is DB-generated — assert `Id > 0`. Deserialise with `JsonOptions`.
- **400** `"Audit payload is required."` — null body
- **400** `"Title is required."` — blank/whitespace title
- **400** `"Title must not exceed 200 characters."` — title > 200 chars
- **400** `"Status is required."` / invalid status messages — missing or out-of-range status
- **400** `"AuditDate is required."` — default date
- **400** `"CreatedBy is required."` — blank createdBy
- **500** — repository throws

`recordStatus` in POST JSON is ignored — not bindable; assert it never appears in response body.

#### GET /audits/{id}
- **200** — returns single audit. Deserialise with `JsonOptions`.
- **404** `"Audit not found."` — id not found or soft-deleted

#### PUT /audits/{id}
- **200** — valid input; returns updated audit. Deserialise with `JsonOptions`.
- **400** `"Audit payload is required."` — null body
- **400** `"Route id does not match audit id."` — route id ≠ body `id`
- **400** `"A valid audit id is required."` — body `id <= 0`
- **400** — same field validation as POST
- **404** `"Audit not found."` — id not found or soft-deleted
- **500** — repository throws

#### DELETE /audits/{id}
- **204** — soft-deletes active audit; subsequent GET returns 404; excluded from GET list
- **404** `"Audit not found."` — id not found or already soft-deleted (second DELETE is 404, not 204)
- **500** — repository throws (if mocked)

**500-test assertion pattern — all endpoints (required):**

```csharp
Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
Assert.NotNull(body);
Assert.Equal("An unexpected error occurred.", body.Error);
var raw = await response.Content.ReadAsStringAsync();
Assert.DoesNotContain("<internal exception message>", raw);
```

## Database and isolation gotchas

- Each test class gets one fresh in-memory SQLite database via its `TestWebApplicationFactory`. Data survives across `[Fact]`s in the same class but never leaks across classes.
- **ItemsApi** uses `AppDbContext`; **IncidentsApi** uses `IncidentsDbContext`; **AuditsApi** uses `AuditsDbContext` — three separate databases and factories. Never mix test projects or factories.
- Schema changes require a new EF migration — the factory applies the committed migrations through `Database.Migrate()` on host creation.
- `Microsoft.Data.Sqlite` in-memory databases are destroyed when the connection closes, which is why the factory holds the `SqliteConnection` open for the fixture's lifetime.
- **IncidentsApi enum storage:** `IncidentSeverity` and `IncidentStatus` are stored as `int` in `incidents.db` for correct sort order and query performance. The JSON layer uses `JsonStringEnumConverter` (string representation over the wire). This means: filter/sort tests on severity or status work correctly when seeding via POST (which round-trips through the string converter), but the DB column value is an int that EF queries against directly.
- **AuditsApi enum storage:** `Status` and `RecordStatus` are stored as `int` in `audits.db`. JSON uses `JsonStringEnumConverter` for `Status` only — `RecordStatus` is never serialised to clients. Soft-deleted rows must be invisible on all read paths and on PUT.

## Which file to write to

| API | Endpoint | File |
|-----|----------|------|
| ItemsApi | GET /items | `ItemsApi.Tests/GetItemsTests.cs` (exists — append new [Fact] before private records) |
| ItemsApi | POST /items | `ItemsApi.Tests/PostItemsTests.cs` (exists — append before closing `}`) |
| ItemsApi | Exception handler | `ItemsApi.Tests/GlobalExceptionHandlerTests.cs` |
| ItemsApi | New endpoint | Create `ItemsApi.Tests/<Endpoint>Tests.cs` |
| IncidentsApi | GET /incidents | `IncidentsApi.Tests/GetIncidentsTests.cs` (exists — append before private records) |
| IncidentsApi | POST /incidents | `IncidentsApi.Tests/PostIncidentsTests.cs` (exists — append before private records) |
| IncidentsApi | GET /incidents/{id} | `IncidentsApi.Tests/GetIncidentByIdTests.cs` (exists — append before private records) |
| IncidentsApi | PUT /incidents/{id} | `IncidentsApi.Tests/PutIncidentsTests.cs` (exists — append before private records) |
| IncidentsApi | New endpoint | Create `IncidentsApi.Tests/<Endpoint>Tests.cs` |
| AuditsApi | GET /audits | `AuditsApi.Tests/GetAuditsTests.cs` (exists — append before private records) |
| AuditsApi | POST /audits | `AuditsApi.Tests/PostAuditsTests.cs` (exists — append before private records) |
| AuditsApi | GET /audits/{id} | `AuditsApi.Tests/GetAuditByIdTests.cs` (exists — append before private records) |
| AuditsApi | PUT /audits/{id} | `AuditsApi.Tests/PutAuditsTests.cs` (exists — append before private records) |
| AuditsApi | DELETE /audits/{id} | `AuditsApi.Tests/DeleteAuditsTests.cs` (exists — append before private records) |
| AuditsApi | New endpoint | Create `AuditsApi.Tests/<Endpoint>Tests.cs` |

When **appending** to an existing file, insert the new `[Fact]` method before the private record declarations at the bottom of the class.

## Workflow for each test request

1. Identify the API (ItemsApi, IncidentsApi, or AuditsApi), the endpoint, and the scenario from the user's message.
2. **Calibrate effort** — apply [Recommended effort level](#recommended-effort-level).
3. Determine the target file (table above).
4. For IncidentsApi or AuditsApi: decide whether to use `CreateDefaultClient()` (real persistence) or `CreateClientWithRepo(mock)` — see [Mocking with NSubstitute — IncidentsApi](#incidentsapi) or [AuditsApi](#auditsapi-2).
5. Look up any uncertain API details via Context7 before writing.
6. Write one test, following the naming convention and A/A/A structure.
7. If the file exists, show only the new method with a clear note about where to insert it. If it's a new file, show the complete file.
8. Run the appropriate test command:
   - ItemsApi: `dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj`
   - IncidentsApi: `dotnet test IncidentsApi.Tests/IncidentsApi.Tests.csproj`
   - AuditsApi: `dotnet test AuditsApi.Tests/AuditsApi.Tests.csproj`
9. Confirm what was written and the test result. If tests fail, fix before offering the next test. Then ask: "Which test would you like next?"
