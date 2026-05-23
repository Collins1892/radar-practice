export interface Item {
  id: number;
  name: string;
  price: number;
}

export interface CreateItemRequest {
  name: string;
  price: number;
}

export interface ApiError {
  error: string;
}
