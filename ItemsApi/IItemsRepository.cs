public interface IItemsRepository
{
    IEnumerable<Item> GetAll();
    Item Add(string name, decimal price);
}
