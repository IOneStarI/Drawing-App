import { DrawingHistory } from '../src/DrawingHistory';
import { DrawingAction } from '../src/types';

const action: DrawingAction = {
  color: '#111827',
  points: [{ x: 1, y: 1 }],
  size: 4,
  tool: 'brush'
};

describe('DrawingHistory', /** Groups the DrawingHistory behavior tests. */ () => {
  it('adds actions and clears redo history after a new action', /** Verifies that the implementation adds actions and clears redo history after a new action. */ () => {
    const history = new DrawingHistory();
    history.add(action);
    history.undo();
    history.add({ ...action, color: '#ef4444' });

    expect(history.undoCount).toBe(1);
    expect(history.redoCount).toBe(0);
  });

  it('moves actions between undo and redo stacks', /** Verifies that the implementation moves actions between undo and redo stacks. */ () => {
    const history = new DrawingHistory([action]);

    expect(history.undo()).toEqual(action);
    expect(history.undoCount).toBe(0);
    expect(history.redo()).toEqual(action);
    expect(history.undoCount).toBe(1);
  });
});
