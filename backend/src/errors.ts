/** Base class for errors that carry an HTTP status code and stable error code for API responses. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicting state') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NoAvailableSeatsError extends AppError {
  constructor(message = 'No contiguous seats available for the requested party size') {
    super(message, 404, 'NO_SEATS_AVAILABLE');
  }
}

export class AiServiceError extends AppError {
  constructor(message = 'AI seat assistant is unavailable') {
    super(message, 503, 'AI_SERVICE_UNAVAILABLE');
  }
}
