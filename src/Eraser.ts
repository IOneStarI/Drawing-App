import { DrawingAppError } from './errors';

export class Eraser {
  private sizeValue: number;

  constructor(size: number) {
    this.sizeValue = 1;
    this.setSize(size);
  }

  public get size(): number {
    return this.sizeValue;
  }

  public setSize(size: number): void {
    if (!Number.isInteger(size) || size < 1 || size > 80) {
      throw new DrawingAppError('Eraser size must be a whole number from 1 to 80.');
    }

    this.sizeValue = size;
  }
}
