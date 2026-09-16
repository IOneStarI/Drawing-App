import { DrawingAppError } from './errors';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export class Brush {
  public readonly availableColors: string[];
  private colorValue: string;
  private sizeValue: number;

  constructor(color: string, size: number, availableColors: string[]) {
    this.availableColors = availableColors;
    this.colorValue = '#000000';
    this.sizeValue = 1;
    this.setColor(color);
    this.setSize(size);
  }

  public get color(): string {
    return this.colorValue;
  }

  public get size(): number {
    return this.sizeValue;
  }

  public setColor(color: string): void {
    if (!HEX_COLOR_PATTERN.test(color)) {
      throw new DrawingAppError(`Unsupported color: ${color}`);
    }

    this.colorValue = color.toLowerCase();
  }

  public setSize(size: number): void {
    if (!Number.isInteger(size) || size < 1 || size > 60) {
      throw new DrawingAppError('Brush size must be a whole number from 1 to 60.');
    }

    this.sizeValue = size;
  }
}
