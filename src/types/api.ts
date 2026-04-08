export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  nextKey?: string;
  total?: number;
}
