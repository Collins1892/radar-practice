using System.Text.Json.Serialization;
using IncidentsApi;
using IncidentsApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddDbContext<IncidentsDbContext>(options =>
    options.UseSqlite("DataSource=incidents.db"));

builder.Services.AddScoped<IIncidentRepository, EfIncidentRepository>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<IncidentsDbContext>().Database.Migrate();
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred." });
    });
});

app.UseCors();
app.UseHttpsRedirection();

app.MapGet("/incidents", (
    IIncidentRepository repo,
    IncidentSeverity? severity,
    IncidentStatus? status,
    string? sortBy,
    string? sortDirection,
    int page = 1,
    int pageSize = 25) =>
{
    if (page < 1)
        return Results.BadRequest(new { error = "Page must be at least 1." });

    if (pageSize < 1)
        return Results.BadRequest(new { error = "Page size must be at least 1." });

    if (pageSize > 100)
        return Results.BadRequest(new { error = "Page size must be 100 or fewer." });

    var resolvedSortBy = string.IsNullOrWhiteSpace(sortBy) ? "reportedDate" : sortBy;
    if (!repo.IsValidSortField(resolvedSortBy))
        return Results.BadRequest(new { error = "Invalid sort field." });

    var resolvedDirection = string.IsNullOrWhiteSpace(sortDirection) ? "desc" : sortDirection;
    if (!TryParseSortDirection(resolvedDirection, out var sortDescending))
        return Results.BadRequest(new { error = "Sort direction must be asc or desc." });

    if (severity.HasValue && !Enum.IsDefined(severity.Value))
        return Results.BadRequest(new { error = "Invalid severity value." });

    if (status.HasValue && !Enum.IsDefined(status.Value))
        return Results.BadRequest(new { error = "Invalid status value." });

    var result = repo.GetPaged(new IncidentListQuery(
        severity,
        status,
        resolvedSortBy,
        sortDescending,
        page,
        pageSize));

    return Results.Ok(new PagedIncidentsResponse(
        result.Items.Select(i => i.ToResponse()).ToList(),
        result.Page,
        result.PageSize,
        result.TotalCount,
        result.TotalPages));
});

app.MapPost("/incidents", (IncidentRequest? req, IIncidentRepository repo) =>
{
    if (req is null)
        return Results.BadRequest(new { error = "Incident payload is required." });

    var validation = ValidateIncidentRequest(req);
    if (validation is not null)
        return validation;

    var incident = new Incident
    {
        Title = req.Title,
        Description = req.Description,
        Location = req.Location,
        Severity = req.Severity,
        Status = req.Status,
        ReportedDate = req.ReportedDate,
    };

    var created = repo.Add(incident);
    return Results.Created($"/incidents/{created.Id}", created.ToResponse());
});

app.MapGet("/incidents/{id}", (int id, IIncidentRepository repo) =>
{
    var incident = repo.GetById(id);
    return incident is null
        ? Results.NotFound(new { error = "Incident not found." })
        : Results.Ok(incident.ToResponse());
});

app.MapPut("/incidents/{id}", (int id, PutIncidentRequest? req, IIncidentRepository repo) =>
{
    if (req is null)
        return Results.BadRequest(new { error = "Incident payload is required." });

    if (id != req.Id)
        return Results.BadRequest(new { error = "Route id does not match incident id." });

    var validation = ValidatePutIncidentRequest(req);
    if (validation is not null)
        return validation;

    var incident = new Incident
    {
        Id = id,
        Title = req.Title,
        Description = req.Description,
        Location = req.Location,
        Severity = req.Severity,
        Status = req.Status,
        ReportedDate = req.ReportedDate,
    };

    var updated = repo.Update(incident);
    return updated is null
        ? Results.NotFound(new { error = "Incident not found." })
        : Results.Ok(updated.ToResponse());
});

app.MapDelete("/incidents/{id}", (int id, IIncidentRepository repo) =>
{
    return repo.SoftDelete(id)
        ? Results.NoContent()
        : Results.NotFound(new { error = "Incident not found." });
});

app.Run();

static IResult? ValidateIncidentRequest(IncidentRequest req)
{
    return ValidateIncidentFields(
        req.Title,
        req.Description,
        req.Location,
        req.Severity,
        req.Status,
        req.ReportedDate);
}

static IResult? ValidatePutIncidentRequest(PutIncidentRequest req)
{
    if (req.Id <= 0)
        return Results.BadRequest(new { error = "A valid incident id is required." });

    return ValidateIncidentFields(
        req.Title,
        req.Description,
        req.Location,
        req.Severity,
        req.Status,
        req.ReportedDate);
}

static IResult? ValidateIncidentFields(
    string title,
    string description,
    string location,
    IncidentSeverity severity,
    IncidentStatus status,
    DateTime reportedDate)
{
    if (string.IsNullOrWhiteSpace(title))
        return Results.BadRequest(new { error = "Title is required." });

    if (title.Length > 50)
        return Results.BadRequest(new { error = "Title must be 50 characters or fewer." });

    if (string.IsNullOrWhiteSpace(description))
        return Results.BadRequest(new { error = "Description is required." });

    if (description.Length > 100)
        return Results.BadRequest(new { error = "Description must be 100 characters or fewer." });

    if (string.IsNullOrWhiteSpace(location))
        return Results.BadRequest(new { error = "Location is required." });

    if (location.Length > 100)
        return Results.BadRequest(new { error = "Location must be 100 characters or fewer." });

    if (!Enum.IsDefined(severity))
        return Results.BadRequest(new { error = "Invalid severity value." });

    if (!Enum.IsDefined(status))
        return Results.BadRequest(new { error = "Invalid status value." });

    if (reportedDate.Date > DateTime.UtcNow.Date)
        return Results.BadRequest(new { error = "Reported date must not be in the future." });

    return null;
}

static bool TryParseSortDirection(string sortDirection, out bool sortDescending)
{
    switch (sortDirection.ToLowerInvariant())
    {
        case "asc":
            sortDescending = false;
            return true;
        case "desc":
            sortDescending = true;
            return true;
        default:
            sortDescending = false;
            return false;
    }
}

public partial class Program { }
