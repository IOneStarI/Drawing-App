import { Brush } from '../src/Brush';
import { DrawingAppError } from '../src/errors';

const colors = ['#111827', '#ef4444', '#ffffff'];

describe('Brush', () => {
  it('stores a supported color and valid size', () => {
    const brush = new Brush('#111827', 8, colors);

    expect(brush.color).toBe('#111827');
    expect(brush.size).toBe(8);
  });

  it('stores a custom valid hex color', () => {
    const brush = new Brush('#111827', 8, colors);

    brush.setColor('#02079c');

    expect(brush.color).toBe('#02079c');
  });

  it('rejects invalid color values', () => {
    const brush = new Brush('#111827', 8, colors);

    expect(() => brush.setColor('blue')).toThrow(DrawingAppError);
  });

  it('rejects invalid sizes', () => {
    const brush = new Brush('#111827', 8, colors);

    expect(() => brush.setSize(0)).toThrow(DrawingAppError);
    expect(() => brush.setSize(61)).toThrow(DrawingAppError);
  });
});
