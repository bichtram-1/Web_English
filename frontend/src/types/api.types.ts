export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
  error?: {
    code?: string;
    details?: any;
  };
}
