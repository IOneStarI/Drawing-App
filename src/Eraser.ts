import { DrawingAppError } from './errors';

export class Eraser {
  private sizeValue: number;

  /** Initializes the eraser with a validated size. */
  constructor(size: number) {
    this.sizeValue = 1;
    this.setSize(size);
  }

  /** Returns the current eraser width in canvas pixels. */
  public get size(): number {
    return this.sizeValue;
  }

  /** Stores a whole-number eraser size from 1 to 80; throws DrawingAppError otherwise. */
  public setSize(size: number): void {
    if (!Number.isInteger(size) || size < 1 || size > 80) {
      throw new DrawingAppError('Eraser size must be a whole number from 1 to 80.');
    }

    this.sizeValue = size;
  }
}
