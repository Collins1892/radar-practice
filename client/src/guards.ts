import type { ApiError, Item } from './types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isItem(value: unknown): value is Item {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.price === 'number'
  )
}

export function isItemArray(value: unknown): value is Item[] {
  return Array.isArray(value) && value.every(isItem)
}

export function isApiErrorBody(value: unknown): value is ApiError {
  return isRecord(value) && typeof value.error === 'string'
}
