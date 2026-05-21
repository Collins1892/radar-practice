export type ApiErrorKind = 'network' | 'http' | 'parse'

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message)
    this.name = 'ApiClientError'
    this.kind = kind
    this.status = status
  }
}

export function toUserMessage(error: unknown, context: 'load' | 'create'): string {
  if (error instanceof ApiClientError) {
    if (error.kind === 'network') {
      return 'Cannot reach the server. Start the API with dotnet run in ItemsApi, then try again.'
    }
    return error.message
  }

  if (error instanceof TypeError) {
    return 'Cannot reach the server. Start the API with dotnet run in ItemsApi, then try again.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return context === 'load'
    ? 'Something went wrong while loading items.'
    : 'Something went wrong while adding the item.'
}
