export interface ApiError {
  success: false;
  timestamp: number;
  error: string;
  details?: string;
  status?: number;
}

export interface HttpError {
  error: {
    error?: string;
    message?: string;
    details?: string;
  };
  status: number;
  message?: string;
}
