import { floodFill, hexToRgba } from '../src/floodFill';

function createImageData(width: number, height: number, fill: [number, number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let index = 0; index < data.length; index += 4) {
    data[index] = fill[0];
    data[index + 1] = fill[1];
    data[index + 2] = fill[2];
    data[index + 3] = fill[3];
  }

  return { colorSpace: 'srgb', data, height, width } as ImageData;
}

describe('floodFill', () => {
  it('fills connected matching pixels with the recursive path on small images', () => {
    const imageData = createImageData(3, 3, [255, 255, 255, 255]);
    const result = floodFill(imageData, 1, 1, hexToRgba('#ef4444'));

    expect(result.changedPixels).toBe(9);
    expect(result.imageData.data[0]).toBe(239);
    expect(result.imageData.data[1]).toBe(68);
    expect(result.imageData.data[2]).toBe(68);
  });

  it('fills a large canvas area without exceeding the call stack', () => {
    const imageData = createImageData(120, 80, [255, 255, 255, 255]);
    const result = floodFill(imageData, 60, 40, hexToRgba('#22c55e'));

    expect(result.changedPixels).toBe(9600);
  });

  it('does not fill across a different colored pixel', () => {
    const imageData = createImageData(3, 1, [255, 255, 255, 255]);
    imageData.data[4] = 0;
    imageData.data[5] = 0;
    imageData.data[6] = 0;
    imageData.data[7] = 255;

    const result = floodFill(imageData, 0, 0, hexToRgba('#ef4444'));

    expect(result.changedPixels).toBe(1);
    expect(result.imageData.data[8]).toBe(255);
  });
});
