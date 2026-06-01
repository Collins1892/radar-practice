using ItemsApi.Data;
using Microsoft.EntityFrameworkCore;

public class EfItemsRepository : IItemsRepository
{
    private readonly AppDbContext _db;

    public EfItemsRepository(AppDbContext db) => _db = db;

    public IEnumerable<Item> GetAll() => _db.Items.AsNoTracking().ToList();

    public Item Add(string name, decimal price)
    {
        var item = new Item(0, name, price);
        _db.Items.Add(item);
        _db.SaveChanges();
        return item;
    }
}
