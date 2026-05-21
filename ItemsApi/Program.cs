var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();
app.UseHttpsRedirection();

var items = new List<Item>
{
    new(1, "Widget", 9.99m),
    new(2, "Gadget", 24.99m),
    new(3, "Doohickey", 4.99m),
};
int nextId = 4;

app.MapGet("/items", () => Results.Ok(items));

app.MapPost("/items", (ItemRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Name))
        return Results.BadRequest(new { error = "Name is required." });

    if (req.Name.Length > 100)
        return Results.BadRequest(new { error = "Name must be under 100 characters." });

    var item = new Item(nextId++, req.Name, req.Price);
    items.Add(item);
    return Results.Created($"/items/{item.Id}", item);
});

app.Run();

record Item(int Id, string Name, decimal Price);
record ItemRequest(string Name, decimal Price);

public partial class Program { }
