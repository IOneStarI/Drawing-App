export class DrawingAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DrawingAppError';
  }
}
