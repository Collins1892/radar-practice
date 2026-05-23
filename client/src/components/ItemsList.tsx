import type { JSX } from 'react'
import type { Item } from '../types'
import './ItemsList.css'

export type ItemsListStatus = 'loading' | 'error' | 'empty' | 'ready'

interface ItemsListProps {
  items: Item[]
  status: ItemsListStatus
  errorMessage: string | null
  onRetry: () => void
  formatPrice: (price: number) => string
}

export function ItemsList({
  items,
  status,
  errorMessage,
  onRetry,
  formatPrice,
}: ItemsListProps): JSX.Element {
  if (status === 'loading') {
    return (
      <div className="items-list-state" role="status" aria-live="polite">
        <div className="items-list-spinner" aria-hidden="true" />
        <p>Loading items…</p>
      </div>
    )
  }

  if (status === 'error' && errorMessage) {
    return (
      <div className="items-list-state items-list-error" role="alert">
        <p className="items-list-error-title">Could not load items</p>
        <p className="items-list-error-detail">{errorMessage}</p>
        <button type="button" className="secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <p className="items-list-state items-list-empty" role="status">
        No items yet. Add one above to get started.
      </p>
    )
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <li key={item.id}>
          <span className="item-name">{item.name}</span>
          <span className="item-price">{formatPrice(item.price)}</span>
        </li>
      ))}
    </ul>
  )
}
