import { Response } from 'express';
import { ApiResponse } from '../types/api.types';

export class ApiResponseHandler {
  static success<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: any
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      statusCode,
      message,
      data,
      meta,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message: string = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      statusCode,
      message,
      error: {
        code: `ERR_${statusCode}`,
        details,
      },
    };
    return res.status(statusCode).json(response);
  }
}
