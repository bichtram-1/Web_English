export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}
