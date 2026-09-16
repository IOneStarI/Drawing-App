export type ShapeTool = 'circle' | 'line' | 'square';

export type ToolMode = 'brush' | 'eraser' | 'fill' | 'picker' | 'text' | ShapeTool;

export interface Point {
  x: number;
  y: number;
}

export interface StrokeAction {
  color: string;
  points: Point[];
  size: number;
  tool: 'brush' | 'eraser';
}

export interface FillAction {
  color: string;
  point: Point;
  tool: 'fill';
}

export interface ShapeAction {
  color: string;
  end: Point;
  size: number;
  start: Point;
  tool: ShapeTool;
}

export interface TextAction {
  color: string;
  height: number;
  point: Point;
  size: number;
  text: string;
  tool: 'text';
  width: number;
}

export type DrawingAction = StrokeAction | FillAction | ShapeAction | TextAction;
