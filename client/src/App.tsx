import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { createItem, fetchItems } from './api';
import { ItemsList } from './components/ItemsList';
import type { ItemsListStatus } from './components/ItemsList';
import { toUserMessage } from './errors';
import type { Item } from './types';
import './App.css';

function formatPrice(price: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

function listStatus(
  loading: boolean,
  listError: string | null,
  items: Item[],
): ItemsListStatus {
  if (loading) return 'loading';
  if (listError) return 'error';
  if (items.length === 0) return 'empty';
  return 'ready';
}

function App(): JSX.Element {
  const [items, setItems] = useState<Item[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async (): Promise<void> => {
    setListError(null);
    setListLoading(true);
    try {
      setItems(await fetchItems());
    } catch (err) {
      setListError(toUserMessage(err, 'load'));
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedPrice = Number.parseFloat(price);

    if (!trimmedName) {
      setFormError('Name is required.');
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Enter a valid price.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await createItem({ name: trimmedName, price: parsedPrice });
      setName('');
      setPrice('');
      await loadItems();
    } catch (err) {
      setFormError(toUserMessage(err, 'create'));
    } finally {
      setSubmitting(false);
    }
  }

  const status = listStatus(listLoading, listError, items);

  return (
    <main className="app">
      <header>
        <h1>Items</h1>
        <p className="subtitle">Inventory from the Items API</p>
      </header>

      <section className="panel">
        <h2>Add item</h2>
        <form className="item-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprocket"
              maxLength={100}
              disabled={submitting}
            />
          </label>
          <label>
            Price
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={submitting}
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add item'}
          </button>
        </form>
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="list-header">
          <h2>All items</h2>
          <button
            type="button"
            className="secondary"
            onClick={() => void loadItems()}
            disabled={listLoading}
          >
            Refresh
          </button>
        </div>

        <ItemsList
          items={items}
          status={status}
          errorMessage={listError}
          onRetry={() => void loadItems()}
          formatPrice={formatPrice}
        />
      </section>
    </main>
  );
}

export default App;
