export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(what = 'Resource'): AppError {
    return new AppError(404, 'NOT_FOUND', `${what} not found`);
  }

  static forbidden(message = 'You do not have permission to do that'): AppError {
    return new AppError(403, 'FORBIDDEN', message);
  }
}
