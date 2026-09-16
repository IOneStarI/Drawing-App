import { Brush } from './Brush';
import { DrawingHistory } from './DrawingHistory';
import { Eraser } from './Eraser';
import { DrawingAppError } from './errors';
import { floodFill, hexToRgba } from './floodFill';
import { DrawingAction, Point, ShapeAction, StrokeAction, TextAction, ToolMode } from './types';

const STORAGE_KEY = 'drawing-app-saved-actions';

export class DrawingApp {
  public readonly availableColors: string[];
  public readonly brush: Brush;
  public readonly eraser: Eraser;
  public readonly history: DrawingHistory;
  public readonly coordinates: Point[];
  public readonly strokes: DrawingAction[];

  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private currentStroke: Point[];
  private drawing: boolean;
  private editorElement: HTMLTextAreaElement | null;
  private mode: ToolMode;
  private pickedColorHandler: (color: string) => void;
  private preview: HTMLElement | null;
  private selectionElement: HTMLDivElement | null;
  private statusHandler: (message: string, isError?: boolean) => void;

  constructor(
    canvas: HTMLCanvasElement,
    statusHandler: (message: string, isError?: boolean) => void,
    preview: HTMLElement | null = null,
    pickedColorHandler: (color: string) => void = () => undefined
  ) {
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
      throw new DrawingAppError('Canvas data is missing.');
    }

    this.canvas = canvas;
    this.context = context;
    this.statusHandler = statusHandler;
    this.availableColors = ['#111827', '#ef4444', '#f59e0b', '#22c55e', '#2563eb', '#7c3aed', '#ffffff'];
    this.brush = new Brush('#111827', 8, this.availableColors);
    this.eraser = new Eraser(18);
    this.history = new DrawingHistory();
    this.coordinates = [];
    this.strokes = [];
    this.currentStroke = [];
    this.drawing = false;
    this.editorElement = null;
    this.mode = 'brush';
    this.pickedColorHandler = pickedColorHandler;
    this.preview = preview;
    this.selectionElement = null;

    this.prepareCanvas();
    this.attachCanvasEvents();
    this.updatePreviewStyle();
  }

  public setMode(mode: ToolMode): void {
    this.mode = mode;
    this.updatePreviewStyle();
    this.statusHandler(`Selected ${mode} tool.`);
  }

  public setColor(color: string): void {
    this.tryAction(() => {
      this.brush.setColor(color);
      this.updatePreviewStyle();
      this.statusHandler(`Brush color changed to ${color}.`);
    });
  }

  public setSize(size: number): void {
    this.tryAction(() => {
      this.brush.setSize(size);
      this.eraser.setSize(Math.min(80, Math.max(1, size * 2)));
      this.updatePreviewStyle();
      this.statusHandler(`Brush size changed to ${size}.`);
    });
  }

  public undo(): void {
    this.tryAction(() => {
      this.history.undo();
      this.renderHistory();
      this.statusHandler('Undo completed.');
    });
  }

  public redo(): void {
    this.tryAction(() => {
      this.history.redo();
      this.renderHistory();
      this.statusHandler('Redo completed.');
    });
  }

  public clear(): void {
    this.tryAction(() => {
      this.history.clear();
      this.strokes.length = 0;
      this.coordinates.length = 0;
      this.prepareCanvas();
      this.statusHandler('Canvas cleared.');
    });
  }

  public async saveDrawing(): Promise<void> {
    await this.tryAsyncAction(async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history.actions));
      this.statusHandler('Drawing saved in browser storage.');
    });
  }

  public async loadDrawing(): Promise<void> {
    await this.tryAsyncAction(async () => {
      const storedDrawing = localStorage.getItem(STORAGE_KEY);

      if (!storedDrawing) {
        throw new DrawingAppError('No saved drawing was found.');
      }

      const actions = JSON.parse(storedDrawing) as DrawingAction[];
      this.history.replace(actions);
      this.renderHistory();
      this.statusHandler('Saved drawing loaded.');
    });
  }

  public async saveImage(): Promise<void> {
    await this.tryAsyncAction(async () => {
      const imageUrl = await this.canvasToImageUrl();
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'drawing.png';
      link.click();
      URL.revokeObjectURL(imageUrl);
      this.statusHandler('Image saved as PNG.');
    });
  }

  public refreshPreview(): void {
    this.updatePreviewStyle();
  }

  private attachCanvasEvents(): void {
    this.canvas.addEventListener('pointerdown', (event) => this.startDrawing(event));
    this.canvas.addEventListener('pointermove', (event) => this.draw(event));
    this.canvas.addEventListener('pointerenter', (event) => this.showPreview(event));
    this.canvas.addEventListener('pointerleave', () => {
      this.hidePreview();
    });
    window.addEventListener('pointerup', () => this.stopDrawing());
  }

  private startDrawing(event: PointerEvent): void {
    event.preventDefault();
    this.movePreview(event);

    this.tryAction(() => {
      const point = this.getCanvasPoint(event);

      if (this.mode === 'fill') {
        this.fill(point);
        return;
      }

      if (this.mode === 'picker') {
        this.pickColor(point);
        return;
      }

      if (this.mode === 'text') {
        this.removeEditor(true);
        this.drawing = true;
        this.currentStroke = [point];
        this.showTextSelection(point, point);
        return;
      }

      this.drawing = true;
      this.currentStroke = [point];
      this.coordinates.push(point);

      if (!this.isShapeMode(this.mode)) {
        this.context.beginPath();
        this.context.moveTo(point.x, point.y);
        this.drawPoint(point);
      }
    });
  }

  private draw(event: PointerEvent): void {
    event.preventDefault();
    this.movePreview(event);

    if (this.drawing && event.buttons === 0) {
      this.stopDrawing();
      return;
    }

    if (!this.drawing || this.mode === 'fill' || this.mode === 'picker') {
      return;
    }

    this.tryAction(() => {
      const point = this.getCanvasPoint(event);
      const previousPoint = this.currentStroke[this.currentStroke.length - 1];
      this.currentStroke.push(point);
      this.coordinates.push(point);

      if (this.mode === 'text') {
        this.showTextSelection(this.currentStroke[0], point);
        return;
      }

      if (this.isShapeMode(this.mode)) {
        this.renderHistory();
        this.renderShape(this.createShapeAction(this.currentStroke[0], point, this.mode));
        return;
      }

      this.applyStrokeStyle();
      this.context.beginPath();
      this.context.moveTo(previousPoint.x, previousPoint.y);
      this.context.lineTo(point.x, point.y);
      this.context.stroke();
    });
  }

  private stopDrawing(): void {
    if (!this.drawing) {
      return;
    }

    this.drawing = false;

    if (this.currentStroke.length === 0) {
      return;
    }

    if (this.mode === 'text') {
      this.createTextEditor(this.currentStroke[0], this.currentStroke[this.currentStroke.length - 1]);
      this.currentStroke = [];
      this.removeTextSelection();
      return;
    }

    const action = this.isShapeMode(this.mode)
      ? this.createShapeAction(this.currentStroke[0], this.currentStroke[this.currentStroke.length - 1], this.mode)
      : {
        color: this.mode === 'eraser' ? '#ffffff' : this.brush.color,
        points: [...this.currentStroke],
        size: this.mode === 'eraser' ? this.eraser.size : this.brush.size,
        tool: this.mode === 'eraser' ? 'eraser' as const : 'brush' as const
      };

    this.history.add(action);
    this.strokes.push(action);
    this.currentStroke = [];
    this.renderHistory();
  }

  private showPreview(event: PointerEvent): void {
    if (!this.preview) {
      return;
    }

    this.preview.classList.add('visible');
    this.movePreview(event);
  }

  private hidePreview(): void {
    if (!this.preview) {
      return;
    }

    this.preview.classList.remove('visible');
  }

  private movePreview(event: PointerEvent): void {
    if (!this.preview) {
      return;
    }

    this.preview.style.left = `${event.clientX}px`;
    this.preview.style.top = `${event.clientY}px`;
  }

  private updatePreviewStyle(): void {
    if (!this.preview) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scale = rect.width > 0 ? rect.width / this.canvas.width : 1;
    const size = this.mode === 'eraser' ? this.eraser.size : this.brush.size;
    const previewSize = this.mode === 'fill' || this.mode === 'picker' || this.mode === 'text' ? 22 : Math.max(6, size * scale);
    const color = this.mode === 'eraser' ? '#64748b' : this.brush.color;
    const fill = this.mode === 'eraser' ? 'rgba(255, 255, 255, 0.55)' : `${this.brush.color}26`;

    this.preview.style.setProperty('--preview-size', `${previewSize}px`);
    this.preview.style.setProperty('--preview-color', color);
    this.preview.style.setProperty('--preview-fill', fill);
    this.preview.classList.toggle('fill-preview', this.mode === 'fill' || this.mode === 'picker' || this.mode === 'text');
  }

  private pickColor(point: Point): void {
    const imageData = this.context.getImageData(point.x, point.y, 1, 1);
    const [red, green, blue] = imageData.data;
    const color = this.rgbToHex(red, green, blue);

    this.brush.setColor(color);
    this.pickedColorHandler(color);
    this.updatePreviewStyle();
    this.statusHandler(`Picked color ${color}.`);
  }

  private fill(point: Point): void {
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const result = floodFill(imageData, point.x, point.y, hexToRgba(this.brush.color));
    this.context.putImageData(result.imageData, 0, 0);
    this.history.add({ color: this.brush.color, point, tool: 'fill' });
    this.statusHandler(`Filled ${result.changedPixels} pixels.`);
  }

  private renderHistory(): void {
    this.prepareCanvas();
    this.strokes.length = 0;
    this.coordinates.length = 0;

    for (const action of this.history.actions) {
      if (action.tool === 'fill') {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const result = floodFill(imageData, action.point.x, action.point.y, hexToRgba(action.color));
        this.context.putImageData(result.imageData, 0, 0);
      } else if (this.isShapeAction(action)) {
        this.renderShape(action);
        this.strokes.push(action);
      } else if (this.isTextAction(action)) {
        this.renderText(action);
        this.strokes.push(action);
      } else {
        this.renderStroke(action);
        this.strokes.push(action);
        this.coordinates.push(...action.points);
      }
    }
  }

  private renderStroke(action: StrokeAction): void {
    if (action.points.length === 0) {
      return;
    }

    this.context.strokeStyle = action.color;
    this.context.fillStyle = action.color;
    this.context.lineWidth = action.size;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';

    this.context.beginPath();
    this.context.moveTo(action.points[0].x, action.points[0].y);

    for (const point of action.points.slice(1)) {
      this.context.lineTo(point.x, point.y);
    }

    this.context.stroke();
    this.drawCircle(action.points[0], action.size / 2, action.color);
  }

  private createShapeAction(start: Point, end: Point, tool: 'circle' | 'line' | 'square'): ShapeAction {
    return {
      color: this.brush.color,
      end,
      size: this.brush.size,
      start,
      tool
    };
  }

  private renderShape(action: ShapeAction): void {
    this.context.strokeStyle = action.color;
    this.context.lineWidth = action.size;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    this.context.beginPath();

    if (action.tool === 'line') {
      this.context.moveTo(action.start.x, action.start.y);
      this.context.lineTo(action.end.x, action.end.y);
    }

    if (action.tool === 'circle') {
      const radius = Math.hypot(action.end.x - action.start.x, action.end.y - action.start.y);
      this.context.arc(action.start.x, action.start.y, radius, 0, Math.PI * 2);
    }

    if (action.tool === 'square') {
      const width = action.end.x - action.start.x;
      const height = action.end.y - action.start.y;
      const side = Math.max(Math.abs(width), Math.abs(height));
      const xDirection = width < 0 ? -1 : 1;
      const yDirection = height < 0 ? -1 : 1;
      this.context.rect(action.start.x, action.start.y, side * xDirection, side * yDirection);
    }

    this.context.stroke();
  }

  private renderText(action: TextAction): void {
    this.context.fillStyle = action.color;
    this.context.font = `${action.size}px Arial, sans-serif`;
    this.context.textBaseline = 'top';

    const lines = this.wrapText(action.text, action.width, action.size);
    const lineHeight = action.size * 1.2;

    lines.forEach((line, index) => {
      const y = action.point.y + (index * lineHeight);

      if (y <= action.point.y + action.height - action.size) {
        this.context.fillText(line, action.point.x, y);
      }
    });
  }

  private createTextEditor(start: Point, end: Point): void {
    const box = this.getCanvasBox(start, end);
    const screenBox = this.canvasBoxToScreenBox(box);
    const editor = document.createElement('textarea');
    const textSize = this.getTextSize();

    editor.className = 'text-editor';
    editor.style.left = `${screenBox.left}px`;
    editor.style.top = `${screenBox.top}px`;
    editor.style.width = `${screenBox.width}px`;
    editor.style.height = `${screenBox.height}px`;
    editor.style.color = this.brush.color;
    editor.style.fontSize = `${textSize * screenBox.scaleX}px`;
    editor.placeholder = 'Type here';

    editor.addEventListener('blur', () => this.removeEditor(true));
    editor.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.removeEditor(false);
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        this.removeEditor(true);
      }
    });

    document.body.appendChild(editor);
    this.editorElement = editor;
    this.hidePreview();
    editor.focus();
  }

  private removeEditor(shouldCommit: boolean): void {
    if (!this.editorElement) {
      return;
    }

    const editor = this.editorElement;
    this.editorElement = null;

    if (shouldCommit && editor.value.trim().length > 0) {
      const box = this.screenBoxToCanvasBox(editor.getBoundingClientRect());
      const action: TextAction = {
        color: this.brush.color,
        height: box.height,
        point: { x: box.x, y: box.y },
        size: this.getTextSize(),
        text: editor.value.trim(),
        tool: 'text',
        width: box.width
      };

      this.history.add(action);
      this.renderHistory();
      this.statusHandler('Text added to canvas.');
    }

    editor.remove();
  }

  private showTextSelection(start: Point, end: Point): void {
    if (!this.selectionElement) {
      this.selectionElement = document.createElement('div');
      this.selectionElement.className = 'text-selection';
      document.body.appendChild(this.selectionElement);
    }

    const screenBox = this.canvasBoxToScreenBox(this.getCanvasBox(start, end));
    this.selectionElement.style.left = `${screenBox.left}px`;
    this.selectionElement.style.top = `${screenBox.top}px`;
    this.selectionElement.style.width = `${screenBox.width}px`;
    this.selectionElement.style.height = `${screenBox.height}px`;
  }

  private removeTextSelection(): void {
    if (!this.selectionElement) {
      return;
    }

    this.selectionElement.remove();
    this.selectionElement = null;
  }

  private applyStrokeStyle(): void {
    const color = this.mode === 'eraser' ? '#ffffff' : this.brush.color;
    const size = this.mode === 'eraser' ? this.eraser.size : this.brush.size;
    this.context.strokeStyle = color;
    this.context.fillStyle = color;
    this.context.lineWidth = size;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  private drawPoint(point: Point): void {
    const color = this.mode === 'eraser' ? '#ffffff' : this.brush.color;
    const size = this.mode === 'eraser' ? this.eraser.size : this.brush.size;
    this.drawCircle(point, size / 2, color);
  }

  private drawCircle(point: Point, radius: number, color: string): void {
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.context.fill();
  }

  private isShapeMode(mode: ToolMode): mode is 'circle' | 'line' | 'square' {
    return mode === 'circle' || mode === 'line' || mode === 'square';
  }

  private isShapeAction(action: DrawingAction): action is ShapeAction {
    return action.tool === 'circle' || action.tool === 'line' || action.tool === 'square';
  }

  private isTextAction(action: DrawingAction): action is TextAction {
    return action.tool === 'text';
  }

  private getTextSize(): number {
    return Math.max(12, this.brush.size * 3);
  }

  private getCanvasBox(start: Point, end: Point): { height: number; width: number; x: number; y: number } {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.max(80, Math.abs(end.x - start.x));
    const height = Math.max(40, Math.abs(end.y - start.y));

    return { height, width, x, y };
  }

  private canvasBoxToScreenBox(box: { height: number; width: number; x: number; y: number }): { height: number; left: number; scaleX: number; scaleY: number; top: number; width: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / this.canvas.width;
    const scaleY = rect.height / this.canvas.height;

    return {
      height: box.height * scaleY,
      left: rect.left + (box.x * scaleX),
      scaleX,
      scaleY,
      top: rect.top + (box.y * scaleY),
      width: box.width * scaleX
    };
  }

  private screenBoxToCanvasBox(rect: DOMRect): { height: number; width: number; x: number; y: number } {
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / canvasRect.width;
    const scaleY = this.canvas.height / canvasRect.height;

    return {
      height: rect.height * scaleY,
      width: rect.width * scaleX,
      x: (rect.left - canvasRect.left) * scaleX,
      y: (rect.top - canvasRect.top) * scaleY
    };
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    this.context.font = `${fontSize}px Arial, sans-serif`;

    const lines: string[] = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let line = '';

      for (const word of words) {
        const testLine = line.length === 0 ? word : `${line} ${word}`;

        if (this.context.measureText(testLine).width > maxWidth && line.length > 0) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }

      lines.push(line);
    }

    return lines;
  }

  private rgbToHex(red: number, green: number, blue: number): string {
    return `#${this.colorPartToHex(red)}${this.colorPartToHex(green)}${this.colorPartToHex(blue)}`;
  }

  private colorPartToHex(value: number): string {
    return value.toString(16).padStart(2, '0');
  }

  private getCanvasPoint(event: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: Math.floor((event.clientX - rect.left) * scaleX),
      y: Math.floor((event.clientY - rect.top) * scaleY)
    };
  }

  private prepareCanvas(): void {
    this.context.fillStyle = '#ffffff';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private async canvasToImageUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (!blob) {
          reject(new DrawingAppError('Canvas data is missing.'));
          return;
        }

        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    });
  }

  private tryAction(action: () => void): void {
    try {
      action();
    } catch (error) {
      this.handleError(error);
    }
  }

  private async tryAsyncAction(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    this.statusHandler(message, true);
  }
}
