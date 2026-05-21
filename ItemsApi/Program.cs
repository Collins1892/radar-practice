var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddSingleton<IItemsRepository, InMemoryItemsRepository>();

var app = builder.Build();

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
    try
    {
        return Results.Ok(repo.GetAll());
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to retrieve items.");
        return Results.Problem("Failed to retrieve items.");
    }
});

app.MapPost("/items", (ItemRequest req, IItemsRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(req.Name))
        return Results.BadRequest(new { error = "Name is required." });

    if (req.Name.Length > 100)
        return Results.BadRequest(new { error = "Name must be under 100 characters." });

    if (req.Price <= 0)
        return Results.BadRequest(new { error = "Price must be greater than zero." });

    try
    {
        var item = repo.Add(req.Name, req.Price);
        return Results.Created($"/items/{item.Id}", item);
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to create item.");
        return Results.Problem("Failed to create item.");
    }
});

app.Run();

public partial class Program { }
