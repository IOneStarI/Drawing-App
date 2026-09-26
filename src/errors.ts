export class DrawingAppError extends Error {
  /** Creates an application-specific error with the supplied message. */
  constructor(message: string) {
    super(message);
    this.name = 'DrawingAppError';
  }
}
