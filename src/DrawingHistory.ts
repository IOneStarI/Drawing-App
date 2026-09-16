import { DrawingAction } from './types';

export class DrawingHistory {
  private undoStack: DrawingAction[];
  private redoStack: DrawingAction[];

  constructor(initialActions: DrawingAction[] = []) {
    this.undoStack = [...initialActions];
    this.redoStack = [];
  }

  public get actions(): DrawingAction[] {
    return [...this.undoStack];
  }

  public get undoCount(): number {
    return this.undoStack.length;
  }

  public get redoCount(): number {
    return this.redoStack.length;
  }

  public add(action: DrawingAction): void {
    this.undoStack.push(action);
    this.redoStack = [];
  }

  public undo(): DrawingAction | undefined {
    const action = this.undoStack.pop();

    if (action) {
      this.redoStack.push(action);
    }

    return action;
  }

  public redo(): DrawingAction | undefined {
    const action = this.redoStack.pop();

    if (action) {
      this.undoStack.push(action);
    }

    return action;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  public replace(actions: DrawingAction[]): void {
    this.undoStack = [...actions];
    this.redoStack = [];
  }
}
