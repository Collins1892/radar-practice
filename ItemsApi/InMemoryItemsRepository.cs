public class InMemoryItemsRepository : IItemsRepository
{
    private readonly List<Item> _items =
    [
        new(1, "Widget", 9.99m),
        new(2, "Gadget", 24.99m),
        new(3, "Doohickey", 4.99m),
    ];
    private int _nextId = 4;

    public IEnumerable<Item> GetAll() => _items;

    public Item Add(string name, decimal price)
    {
        if (_nextId == int.MaxValue)
            throw new InvalidOperationException("Item limit reached.");
        var item = new Item(_nextId++, name, price);
        _items.Add(item);
        return item;
    }
}
