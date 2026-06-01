using ItemsApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("DataSource=app.db"));

builder.Services.AddScoped<IItemsRepository, EfItemsRepository>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
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

app.MapGet("/items", (IItemsRepository repo) =>
{
    return Results.Ok(repo.GetAll());
});

app.MapPost("/items", (ItemRequest req, IItemsRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(req.Name))
        return Results.BadRequest(new { error = "Name is required." });

    if (req.Name.Length > 100)
        return Results.BadRequest(new { error = "Name must be under 100 characters." });

    if (req.Price <= 0)
        return Results.BadRequest(new { error = "Price must be greater than zero." });

    var item = repo.Add(req.Name, req.Price);
    return Results.Created((string?)null, item);
});

app.Run();

public partial class Program { }
