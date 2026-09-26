import { Brush } from '../src/Brush';
import { DrawingAppError } from '../src/errors';

const colors = ['#111827', '#ef4444', '#ffffff'];

describe('Brush', /** Groups the Brush behavior tests. */ () => {
  it('stores a supported color and valid size', /** Verifies that the implementation stores a supported color and valid size. */ () => {
    const brush = new Brush('#111827', 8, colors);

    expect(brush.color).toBe('#111827');
    expect(brush.size).toBe(8);
  });

  it('stores a custom valid hex color', /** Verifies that the implementation stores a custom valid hex color. */ () => {
    const brush = new Brush('#111827', 8, colors);

    brush.setColor('#02079c');

    expect(brush.color).toBe('#02079c');
  });

  it('rejects invalid color values', /** Verifies that the implementation rejects invalid color values. */ () => {
    const brush = new Brush('#111827', 8, colors);

    expect(/** Invokes invalid input so Jest can verify the thrown error. */ () => brush.setColor('blue')).toThrow(DrawingAppError);
  });

  it('rejects invalid sizes', /** Verifies that the implementation rejects invalid sizes. */ () => {
    const brush = new Brush('#111827', 8, colors);

    expect(/** Invokes invalid input so Jest can verify the thrown error. */ () => brush.setSize(0)).toThrow(DrawingAppError);
    expect(/** Invokes invalid input so Jest can verify the thrown error. */ () => brush.setSize(61)).toThrow(DrawingAppError);
  });
});
