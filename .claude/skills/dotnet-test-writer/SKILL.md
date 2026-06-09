---
name: dotnet-test-writer
description: Write integration tests for the .NET 8 minimal API in this project (ItemsApi). Use when the user asks to write or add an ItemsApi integration test. One [Fact] per request. Uses xUnit 2.5.3, the project's custom TestWebApplicationFactory (SQLite-backed), NSubstitute 5.1.0, the [Fact] attribute, and Arrange/Act/Assert comments. Run dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj after adding or changing a test. Calibrate effort: think hard for mock/exception paths, fixture isolation, or new endpoints.
---

# .NET Test Writer

Guides writing integration tests for the `ItemsApi` .NET 8 minimal API.

## Core rules

- **One test per request.** Write one `[Fact]` method per request; offer the next test separately.
- **Run `dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj`** after adding or changing a test.
- **Use Context7** when you need to verify current xUnit or NSubstitute API details:
  1. `mcp__context7__resolve-library-id` with library name + question
  2. `mcp__context7__query-docs` with the resolved ID

## Recommended effort level

Calibrate reasoning depth to the test scenario:

| Situation | Guidance |
|-----------|----------|
| NSubstitute exception paths, scoped DI vs mock override, or shared-fixture persistence ordering | **think hard** |
| New endpoint file, custom status/body shape, or GlobalExceptionHandler behaviour | **think hard** |
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

The test project references `Microsoft.EntityFrameworkCore.Sqlite` (8.0.27), and `TestWebApplicationFactory` uses `Microsoft.Data.Sqlite` directly (`SqliteConnection`) for its in-memory database.

The `Xunit` namespace is globally imported (via `<Using Include="Xunit" />` in the csproj) — no `using Xunit;` needed.

## Project layout

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
  TestWebApplicationFactory.cs — custom factory; per-class in-memory SQLite DB
  PostItemsTests.cs           — POST /items tests (file already exists)
  GlobalExceptionHandlerTests.cs
  GetItemsTests.cs            — GET /items tests (file already exists — append new [Fact] before private records)
```

## Test class structure (boilerplate)

All test classes follow this shape — no explicit namespace, private helper methods, private response records at the bottom:

```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
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

## Naming convention

Format: `<HttpVerb>_<Scenario>_<ExpectedResult>`

Examples:
- `Get_NoItems_ReturnsEmptyArray`
- `Get_WithTwoItems_ReturnsBothItems`
- `Get_WhenRepositoryThrows_Returns500`
- `Post_ValidItem_Returns201WithItem`
- `Post_EmptyName_Returns400WithError`
- `Post_WhenRepositoryThrows_Returns500`

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

**Use `CreateClientWithRepo(mock)` when the test needs to force specific `GetAll()` contents or simulate a repository exception. Use `CreateDefaultClient()` when the test exercises real persistence (create, round-trip read).**

`IClassFixture` gives the whole test class a single shared `TestWebApplicationFactory` instance. The real repository is now `EfItemsRepository` (registered **scoped**), backed by an in-memory SQLite database that the factory creates per test class — a `SqliteConnection("DataSource=:memory:")` opened in the fixture constructor, kept open for the fixture's lifetime, migrated on host creation, and disposed at the end. Each test class therefore gets its own isolated database; data does **not** leak across classes. Data added within a class *does* persist across that class's `[Fact]`s (shared fixture), so a test that asserts the repo is empty or contains exactly N items via `CreateDefaultClient()` can be fragile within the class unless it owns the state.

`CreateClientWithRepo(repo)` overrides the EF repository with a fresh mock for that one client, so the test owns its data completely and runs correctly regardless of execution order.

`CreateDefaultClient()` now runs against the real, isolated, migrated in-memory database — it is the right choice for persistence and round-trip behaviour (for example, posting an item and reading it back), as well as for validation errors (400) that never reach the repository.

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

## Endpoint reference

### GET /items
- **200** — returns `Item[]` (JSON array)
- **500** — repository throws

### POST /items
- **201** — valid input; returns `{ id, name, price }`. The `id` is DB-generated (auto-increment), so assert `Id > 0` rather than a specific value. Decimal price precision is preserved on round-trip because `Price` is mapped via `HasConversion<string>()`.
- **400** `"Name is required."` — empty or whitespace name
- **400** `"Name must be under 100 characters."` — name > 100 chars
- **400** `"Price must be greater than zero."` — price ≤ 0
- **500** — repository throws

## Database and isolation gotchas

- Each test class gets one fresh in-memory SQLite database via `TestWebApplicationFactory`. Data survives across `[Fact]`s in the same class but never leaks across classes.
- Schema changes require a new EF migration — the factory applies the committed migrations through `Database.Migrate()` on host creation.
- `Microsoft.Data.Sqlite` in-memory databases are destroyed when the connection closes, which is why the factory holds the `SqliteConnection` open for the fixture's lifetime.

## Which file to write to

| Endpoint | File |
|----------|------|
| GET /items | `ItemsApi.Tests/GetItemsTests.cs` (create if absent) |
| POST /items | `ItemsApi.Tests/PostItemsTests.cs` (exists — append before closing `}`) |
| Exception handler | `ItemsApi.Tests/GlobalExceptionHandlerTests.cs` |
| New endpoint | Create `ItemsApi.Tests/<Endpoint>Tests.cs` |

When **appending** to an existing file, insert the new `[Fact]` method before the private record declarations at the bottom of the class.

## Workflow for each test request

1. Identify endpoint and scenario from the user's message.
2. **Calibrate effort** — apply [Recommended effort level](#recommended-effort-level).
3. Determine the target file (table above).
4. Look up any uncertain API details via Context7 before writing.
5. Write one test, following the naming convention and A/A/A structure.
6. If the file exists, show only the new method with a clear note about where to insert it. If it's a new file, show the complete file.
7. Run `dotnet test ItemsApi.Tests/ItemsApi.Tests.csproj` after adding or changing the test.
8. Confirm what was written and the test result, then ask: "Which test would you like next?"
