using System.Text.Json.Serialization;
using AuditsApi;
using AuditsApi.Data;
using AuditsApi.Models;
using AuditsApi.Repositories;
using Microsoft.EntityFrameworkCore;

const string InvalidStatusMessage =
    "Status must be one of: Scheduled, InProgress, Completed, Cancelled.";

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? throw new InvalidOperationException("Cors:AllowedOrigins is not configured.");

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddDbContext<AuditsDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IAuditRepository, EfAuditRepository>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AuditsDbContext>().Database.Migrate();
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

app.UseHttpsRedirection();
app.UseCors();

app.MapGet("/audits", (
    IAuditRepository repo,
    Status? status,
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

    var resolvedSortBy = string.IsNullOrWhiteSpace(sortBy) ? "auditDate" : sortBy;
    if (!repo.IsValidSortField(resolvedSortBy))
        return Results.BadRequest(new { error = "Invalid sort field." });

    var resolvedDirection = string.IsNullOrWhiteSpace(sortDirection) ? "desc" : sortDirection;
    if (!TryParseSortDirection(resolvedDirection, out var sortDescending))
        return Results.BadRequest(new { error = "Sort direction must be asc or desc." });

    if (status.HasValue && !Enum.IsDefined(status.Value))
        return Results.BadRequest(new { error = InvalidStatusMessage });

    var result = repo.GetAll(new AuditListQuery(
        status,
        resolvedSortBy,
        sortDescending,
        page,
        pageSize));

    return Results.Ok(new PagedAuditsResponse(
        result.Items.Select(a => a.ToResponse()).ToList(),
        result.Page,
        result.PageSize,
        result.TotalCount,
        result.TotalPages));
});

app.MapPost("/audits", (AuditRequest? req, IAuditRepository repo) =>
{
    var validation = ValidateAuditRequest(req);
    if (validation is not null)
        return validation;

    var audit = new Audit
    {
        Title = req!.Title,
        Description = req.Description,
        AuditDate = req.AuditDate,
        Status = req.Status!.Value,
        CreatedBy = req.CreatedBy,
    };

    var created = repo.Add(audit);
    return Results.Created($"/audits/{created.Id}", created.ToResponse());
});

app.MapGet("/audits/{id}", (int id, IAuditRepository repo) =>
{
    var audit = repo.GetById(id);
    return audit is null
        ? Results.NotFound(new { error = "Audit not found." })
        : Results.Ok(audit.ToResponse());
});

app.MapPut("/audits/{id}", (int id, PutAuditRequest? req, IAuditRepository repo) =>
{
    if (req is null)
        return Results.BadRequest(new { error = "Audit payload is required." });

    if (id != req.Id)
        return Results.BadRequest(new { error = "Route id does not match audit id." });

    var validation = ValidatePutAuditRequest(req);
    if (validation is not null)
        return validation;

    var audit = new Audit
    {
        Id = id,
        Title = req.Title,
        Description = req.Description,
        AuditDate = req.AuditDate,
        Status = req.Status!.Value,
        CreatedBy = req.CreatedBy,
    };

    var updated = repo.Update(audit);
    return updated is null
        ? Results.NotFound(new { error = "Audit not found." })
        : Results.Ok(updated.ToResponse());
});

app.MapDelete("/audits/{id}", (int id, IAuditRepository repo) =>
{
    return repo.SoftDelete(id)
        ? Results.NoContent()
        : Results.NotFound(new { error = "Audit not found." });
});

app.Run();

static IResult? ValidateAuditRequest(AuditRequest? req)
{
    if (req is null)
        return Results.BadRequest(new { error = "Audit payload is required." });

    return ValidateAuditFields(req.Title, req.Status, req.AuditDate, req.CreatedBy);
}

static IResult? ValidatePutAuditRequest(PutAuditRequest? req)
{
    if (req is null)
        return Results.BadRequest(new { error = "Audit payload is required." });

    if (req.Id <= 0)
        return Results.BadRequest(new { error = "A valid audit id is required." });

    return ValidateAuditFields(req.Title, req.Status, req.AuditDate, req.CreatedBy);
}

static IResult? ValidateAuditFields(
    string title,
    Status? status,
    DateTime auditDate,
    string createdBy)
{
    if (string.IsNullOrWhiteSpace(title))
        return Results.BadRequest(new { error = "Title is required." });

    if (title.Length > 200)
        return Results.BadRequest(new { error = "Title must not exceed 200 characters." });

    if (status is null)
        return Results.BadRequest(new { error = "Status is required." });

    if (!Enum.IsDefined(status.Value))
        return Results.BadRequest(new { error = InvalidStatusMessage });

    if (auditDate == default)
        return Results.BadRequest(new { error = "AuditDate is required." });

    if (string.IsNullOrWhiteSpace(createdBy))
        return Results.BadRequest(new { error = "CreatedBy is required." });

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
