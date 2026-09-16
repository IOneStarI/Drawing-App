import { DrawingAppError } from './errors';

const RECURSIVE_FILL_PIXEL_LIMIT = 400;

export interface RgbaColor {
  a: number;
  b: number;
  g: number;
  r: number;
}

export interface FloodFillResult {
  changedPixels: number;
  imageData: ImageData;
}

export function hexToRgba(hexColor: string): RgbaColor {
  if (!/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    throw new DrawingAppError(`Unsupported color: ${hexColor}`);
  }

  return {
    a: 255,
    b: parseInt(hexColor.slice(5, 7), 16),
    g: parseInt(hexColor.slice(3, 5), 16),
    r: parseInt(hexColor.slice(1, 3), 16)
  };
}

export function floodFill(imageData: ImageData, startX: number, startY: number, fillColor: RgbaColor): FloodFillResult {
  if (!imageData || !imageData.data) {
    throw new DrawingAppError('Canvas data is missing.');
  }

  const { width, height, data } = imageData;

  if (!Number.isInteger(startX) || !Number.isInteger(startY) || startX < 0 || startY < 0 || startX >= width || startY >= height) {
    throw new DrawingAppError('Fill coordinates must be inside the canvas.');
  }

  const startIndex = getPixelIndex(startX, startY, width);
  const targetColor = readPixel(data, startIndex);

  if (colorsMatch(targetColor, fillColor)) {
    return { changedPixels: 0, imageData };
  }

  if (width * height <= RECURSIVE_FILL_PIXEL_LIMIT) {
    return floodFillRecursive(imageData, startX, startY, targetColor, fillColor);
  }

  return floodFillWithStack(imageData, startX, startY, targetColor, fillColor);
}

function floodFillRecursive(imageData: ImageData, startX: number, startY: number, targetColor: RgbaColor, fillColor: RgbaColor): FloodFillResult {
  const { width, height, data } = imageData;
  const checkedPixels: boolean[] = new Array(width * height).fill(false);
  let changedPixels = 0;

  const fillPixel = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const pixelNumber = y * width + x;

    if (checkedPixels[pixelNumber]) {
      return;
    }

    checkedPixels[pixelNumber] = true;
    const index = getPixelIndex(x, y, width);

    if (!colorsMatch(readPixel(data, index), targetColor)) {
      return;
    }

    writePixel(data, index, fillColor);
    changedPixels += 1;

    fillPixel(x + 1, y);
    fillPixel(x - 1, y);
    fillPixel(x, y + 1);
    fillPixel(x, y - 1);
  };

  fillPixel(startX, startY);

  return { changedPixels, imageData };
}

function floodFillWithStack(imageData: ImageData, startX: number, startY: number, targetColor: RgbaColor, fillColor: RgbaColor): FloodFillResult {
  const { width, height, data } = imageData;
  const checkedPixels: boolean[] = new Array(width * height).fill(false);
  const pixelsToCheck: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let changedPixels = 0;

  while (pixelsToCheck.length > 0) {
    const pixel = pixelsToCheck.pop();

    if (!pixel) {
      continue;
    }

    const { x, y } = pixel;

    if (x < 0 || y < 0 || x >= width || y >= height) {
      continue;
    }

    const pixelNumber = y * width + x;

    if (checkedPixels[pixelNumber]) {
      continue;
    }

    checkedPixels[pixelNumber] = true;
    const index = getPixelIndex(x, y, width);

    if (!colorsMatch(readPixel(data, index), targetColor)) {
      continue;
    }

    writePixel(data, index, fillColor);
    changedPixels += 1;

    pixelsToCheck.push({ x: x + 1, y });
    pixelsToCheck.push({ x: x - 1, y });
    pixelsToCheck.push({ x, y: y + 1 });
    pixelsToCheck.push({ x, y: y - 1 });
  }

  return { changedPixels, imageData };
}

function getPixelIndex(x: number, y: number, width: number): number {
  return (y * width + x) * 4;
}

function readPixel(data: Uint8ClampedArray, index: number): RgbaColor {
  return {
    a: data[index + 3],
    b: data[index + 2],
    g: data[index + 1],
    r: data[index]
  };
}

function writePixel(data: Uint8ClampedArray, index: number, color: RgbaColor): void {
  data[index] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}

function colorsMatch(first: RgbaColor, second: RgbaColor): boolean {
  return first.r === second.r && first.g === second.g && first.b === second.b && first.a === second.a;
}
