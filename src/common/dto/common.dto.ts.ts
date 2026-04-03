export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface IdempotentRequest {
  idempotencyKey: string;
}