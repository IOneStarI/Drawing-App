import { DrawingAction } from './types';

export class DrawingHistory {
  private undoStack: DrawingAction[];
  private redoStack: DrawingAction[];

  /** Copies initial actions into the undo stack and starts with an empty redo stack. */
  constructor(initialActions: DrawingAction[] = []) {
    this.undoStack = [...initialActions];
    this.redoStack = [];
  }

  /** Returns a shallow copy of the active action list to protect the stack structure. */
  public get actions(): DrawingAction[] {
    return [...this.undoStack];
  }

  /** Returns the number of actions available to undo. */
  public get undoCount(): number {
    return this.undoStack.length;
  }

  /** Returns the number of actions available to redo. */
  public get redoCount(): number {
    return this.redoStack.length;
  }

  /** Records a new action and discards the previous redo branch. */
  public add(action: DrawingAction): void {
    this.undoStack.push(action);
    this.redoStack = [];
  }

  /** Moves the latest action to the redo stack, returning undefined when empty. */
  public undo(): DrawingAction | undefined {
    const action = this.undoStack.pop();

    if (action) {
      this.redoStack.push(action);
    }

    return action;
  }

  /** Moves the latest undone action back to the undo stack, returning undefined when empty. */
  public redo(): DrawingAction | undefined {
    const action = this.redoStack.pop();

    if (action) {
      this.undoStack.push(action);
    }

    return action;
  }

  /** Empties both history stacks. */
  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /** Replaces active history with a shallow copy of supplied actions and clears redo history. */
  public replace(actions: DrawingAction[]): void {
    this.undoStack = [...actions];
    this.redoStack = [];
  }
}
