---
name: dotnet-test-writer
description: Write integration tests for the .NET 8 minimal API in this project (ItemsApi). Use this skill whenever the user asks to write, add, generate, or create a test for the .NET API — even if they just say "write a test for GET /items" or "add a failing case for invalid price". Always write exactly one test at a time. Uses xUnit 2.5.3, WebApplicationFactory, NSubstitute 5.1.0, the [Fact] attribute, and Arrange/Act/Assert comments.
---

# .NET Test Writer

Guides writing integration tests for the `ItemsApi` .NET 8 minimal API.

## Core rules

- **One test per request.** Write exactly one `[Fact]` method. When done, ask which test to write next — never generate a batch.
- **Never run `dotnet test`.** Just produce the code.
- **Use Context7** when you need to verify current xUnit or NSubstitute API details:
  1. `mcp__context7__resolve-library-id` with library name + question
  2. `mcp__context7__query-docs` with the resolved ID

## Tech stack

| Library | Version |
|---------|---------|
| xUnit | 2.5.3 |
| NSubstitute | 5.1.0 |
| Microsoft.AspNetCore.Mvc.Testing | 8.0.0 |
| Target framework | .NET 8.0 |

The `Xunit` namespace is globally imported (via `<Using Include="Xunit" />` in the csproj) — no `using Xunit;` needed.

## Project layout

```
ItemsApi/
  Program.cs                  — GET /items and POST /items endpoints
  IItemsRepository.cs         — interface: GetAll(), Add(string name, decimal price)
  Item.cs                     — record Item(int Id, string Name, decimal Price)
  ItemRequest.cs              — record ItemRequest(string Name, decimal Price)

ItemsApi.Tests/
  PostItemsTests.cs           — POST /items tests (file already exists)
  GlobalExceptionHandlerTests.cs
  GetItemsTests.cs            — create this if writing GET /items tests
```

## Test class structure (boilerplate)

All test classes use this exact shape — no explicit namespace, private helper methods, private response records at the bottom:

```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

public class <FeatureName>Tests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public <FeatureName>Tests(WebApplicationFactory<Program> factory)
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

Always include the three comment markers, even when Arrange is minimal:

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

**Always use `CreateClientWithRepo` with a mock — never `CreateDefaultClient` — when the test cares about the shape or contents of the repository data.**

`IClassFixture` gives the whole test class a single shared `WebApplicationFactory` instance, which means a single shared `InMemoryItemsRepository` singleton. Items added by one test (or leaked from another class that ran first in the same process) persist for the lifetime of that factory. A test that calls `CreateDefaultClient()` and then asserts the repo is empty, or contains exactly N items, will be fragile and order-dependent.

`CreateClientWithRepo(repo)` replaces the singleton with a fresh mock for that one client, so the test owns its data completely and runs correctly regardless of execution order.

`CreateDefaultClient()` is safe only when the test makes no assumptions about repository state — for example, a test that only checks a validation error (400) before the repo is ever reached.

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
- **201** — valid input; returns `{ id, name, price }`
- **400** `"Name is required."` — empty or whitespace name
- **400** `"Name must be under 100 characters."` — name > 100 chars
- **400** `"Price must be greater than zero."` — price ≤ 0
- **500** — repository throws

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
2. Determine the target file (table above).
3. Look up any uncertain API details via Context7 before writing.
4. Write exactly one test, following the naming convention and A/A/A structure.
5. If the file exists, show only the new method with a clear note about where to insert it. If it's a new file, show the complete file.
6. Do NOT run `dotnet test`.
7. Confirm what was written, then ask: "Which test would you like next?"
