// src/errors.ts
var DrawingAppError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DrawingAppError";
  }
};

// src/Brush.ts
var HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
var Brush = class {
  availableColors;
  colorValue;
  sizeValue;
  constructor(color, size, availableColors) {
    this.availableColors = availableColors;
    this.colorValue = "#000000";
    this.sizeValue = 1;
    this.setColor(color);
    this.setSize(size);
  }
  get color() {
    return this.colorValue;
  }
  get size() {
    return this.sizeValue;
  }
  setColor(color) {
    if (!HEX_COLOR_PATTERN.test(color)) {
      throw new DrawingAppError(`Unsupported color: ${color}`);
    }
    this.colorValue = color.toLowerCase();
  }
  setSize(size) {
    if (!Number.isInteger(size) || size < 1 || size > 60) {
      throw new DrawingAppError("Brush size must be a whole number from 1 to 60.");
    }
    this.sizeValue = size;
  }
};

// src/DrawingHistory.ts
var DrawingHistory = class {
  undoStack;
  redoStack;
  constructor(initialActions = []) {
    this.undoStack = [...initialActions];
    this.redoStack = [];
  }
  get actions() {
    return [...this.undoStack];
  }
  get undoCount() {
    return this.undoStack.length;
  }
  get redoCount() {
    return this.redoStack.length;
  }
  add(action) {
    this.undoStack.push(action);
    this.redoStack = [];
  }
  undo() {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
    }
    return action;
  }
  redo() {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
    }
    return action;
  }
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
  replace(actions) {
    this.undoStack = [...actions];
    this.redoStack = [];
  }
};

// src/Eraser.ts
var Eraser = class {
  sizeValue;
  constructor(size) {
    this.sizeValue = 1;
    this.setSize(size);
  }
  get size() {
    return this.sizeValue;
  }
  setSize(size) {
    if (!Number.isInteger(size) || size < 1 || size > 80) {
      throw new DrawingAppError("Eraser size must be a whole number from 1 to 80.");
    }
    this.sizeValue = size;
  }
};

// src/floodFill.ts
var RECURSIVE_FILL_PIXEL_LIMIT = 400;
function hexToRgba(hexColor) {
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
function floodFill(imageData, startX, startY, fillColor) {
  if (!imageData || !imageData.data) {
    throw new DrawingAppError("Canvas data is missing.");
  }
  const { width, height, data } = imageData;
  if (!Number.isInteger(startX) || !Number.isInteger(startY) || startX < 0 || startY < 0 || startX >= width || startY >= height) {
    throw new DrawingAppError("Fill coordinates must be inside the canvas.");
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
function floodFillRecursive(imageData, startX, startY, targetColor, fillColor) {
  const { width, height, data } = imageData;
  const checkedPixels = new Array(width * height).fill(false);
  let changedPixels = 0;
  const fillPixel = (x, y) => {
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
function floodFillWithStack(imageData, startX, startY, targetColor, fillColor) {
  const { width, height, data } = imageData;
  const checkedPixels = new Array(width * height).fill(false);
  const pixelsToCheck = [{ x: startX, y: startY }];
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
function getPixelIndex(x, y, width) {
  return (y * width + x) * 4;
}
function readPixel(data, index) {
  return {
    a: data[index + 3],
    b: data[index + 2],
    g: data[index + 1],
    r: data[index]
  };
}
function writePixel(data, index, color) {
  data[index] = color.r;
  data[index + 1] = color.g;
  data[index + 2] = color.b;
  data[index + 3] = color.a;
}
function colorsMatch(first, second) {
  return first.r === second.r && first.g === second.g && first.b === second.b && first.a === second.a;
}

// src/DrawingApp.ts
var STORAGE_KEY = "drawing-app-saved-actions";
var DrawingApp = class {
  availableColors;
  brush;
  eraser;
  history;
  coordinates;
  strokes;
  canvas;
  context;
  currentStroke;
  drawing;
  editorElement;
  mode;
  pickedColorHandler;
  preview;
  selectionElement;
  statusHandler;
  constructor(canvas2, statusHandler, preview = null, pickedColorHandler = () => void 0) {
    const context = canvas2.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new DrawingAppError("Canvas data is missing.");
    }
    this.canvas = canvas2;
    this.context = context;
    this.statusHandler = statusHandler;
    this.availableColors = ["#111827", "#ef4444", "#f59e0b", "#22c55e", "#2563eb", "#7c3aed", "#ffffff"];
    this.brush = new Brush("#111827", 8, this.availableColors);
    this.eraser = new Eraser(18);
    this.history = new DrawingHistory();
    this.coordinates = [];
    this.strokes = [];
    this.currentStroke = [];
    this.drawing = false;
    this.editorElement = null;
    this.mode = "brush";
    this.pickedColorHandler = pickedColorHandler;
    this.preview = preview;
    this.selectionElement = null;
    this.prepareCanvas();
    this.attachCanvasEvents();
    this.updatePreviewStyle();
  }
  setMode(mode) {
    this.mode = mode;
    this.updatePreviewStyle();
    this.statusHandler(`Selected ${mode} tool.`);
  }
  setColor(color) {
    this.tryAction(() => {
      this.brush.setColor(color);
      this.updatePreviewStyle();
      this.statusHandler(`Brush color changed to ${color}.`);
    });
  }
  setSize(size) {
    this.tryAction(() => {
      this.brush.setSize(size);
      this.eraser.setSize(Math.min(80, Math.max(1, size * 2)));
      this.updatePreviewStyle();
      this.statusHandler(`Brush size changed to ${size}.`);
    });
  }
  undo() {
    this.tryAction(() => {
      this.history.undo();
      this.renderHistory();
      this.statusHandler("Undo completed.");
    });
  }
  redo() {
    this.tryAction(() => {
      this.history.redo();
      this.renderHistory();
      this.statusHandler("Redo completed.");
    });
  }
  clear() {
    this.tryAction(() => {
      this.history.clear();
      this.strokes.length = 0;
      this.coordinates.length = 0;
      this.prepareCanvas();
      this.statusHandler("Canvas cleared.");
    });
  }
  async saveDrawing() {
    await this.tryAsyncAction(async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history.actions));
      this.statusHandler("Drawing saved in browser storage.");
    });
  }
  async loadDrawing() {
    await this.tryAsyncAction(async () => {
      const storedDrawing = localStorage.getItem(STORAGE_KEY);
      if (!storedDrawing) {
        throw new DrawingAppError("No saved drawing was found.");
      }
      const actions = JSON.parse(storedDrawing);
      this.history.replace(actions);
      this.renderHistory();
      this.statusHandler("Saved drawing loaded.");
    });
  }
  async saveImage() {
    await this.tryAsyncAction(async () => {
      const imageUrl = await this.canvasToImageUrl();
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = "drawing.png";
      link.click();
      URL.revokeObjectURL(imageUrl);
      this.statusHandler("Image saved as PNG.");
    });
  }
  refreshPreview() {
    this.updatePreviewStyle();
  }
  attachCanvasEvents() {
    this.canvas.addEventListener("pointerdown", (event) => this.startDrawing(event));
    this.canvas.addEventListener("pointermove", (event) => this.draw(event));
    this.canvas.addEventListener("pointerenter", (event) => this.showPreview(event));
    this.canvas.addEventListener("pointerleave", () => {
      this.hidePreview();
    });
    window.addEventListener("pointerup", () => this.stopDrawing());
  }
  startDrawing(event) {
    event.preventDefault();
    this.movePreview(event);
    this.tryAction(() => {
      const point = this.getCanvasPoint(event);
      if (this.mode === "fill") {
        this.fill(point);
        return;
      }
      if (this.mode === "picker") {
        this.pickColor(point);
        return;
      }
      if (this.mode === "text") {
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
  draw(event) {
    event.preventDefault();
    this.movePreview(event);
    if (this.drawing && event.buttons === 0) {
      this.stopDrawing();
      return;
    }
    if (!this.drawing || this.mode === "fill" || this.mode === "picker") {
      return;
    }
    this.tryAction(() => {
      const point = this.getCanvasPoint(event);
      const previousPoint = this.currentStroke[this.currentStroke.length - 1];
      this.currentStroke.push(point);
      this.coordinates.push(point);
      if (this.mode === "text") {
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
  stopDrawing() {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
    if (this.currentStroke.length === 0) {
      return;
    }
    if (this.mode === "text") {
      this.createTextEditor(this.currentStroke[0], this.currentStroke[this.currentStroke.length - 1]);
      this.currentStroke = [];
      this.removeTextSelection();
      return;
    }
    const action = this.isShapeMode(this.mode) ? this.createShapeAction(this.currentStroke[0], this.currentStroke[this.currentStroke.length - 1], this.mode) : {
      color: this.mode === "eraser" ? "#ffffff" : this.brush.color,
      points: [...this.currentStroke],
      size: this.mode === "eraser" ? this.eraser.size : this.brush.size,
      tool: this.mode === "eraser" ? "eraser" : "brush"
    };
    this.history.add(action);
    this.strokes.push(action);
    this.currentStroke = [];
    this.renderHistory();
  }
  showPreview(event) {
    if (!this.preview) {
      return;
    }
    this.preview.classList.add("visible");
    this.movePreview(event);
  }
  hidePreview() {
    if (!this.preview) {
      return;
    }
    this.preview.classList.remove("visible");
  }
  movePreview(event) {
    if (!this.preview) {
      return;
    }
    this.preview.style.left = `${event.clientX}px`;
    this.preview.style.top = `${event.clientY}px`;
  }
  updatePreviewStyle() {
    if (!this.preview) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const scale = rect.width > 0 ? rect.width / this.canvas.width : 1;
    const size = this.mode === "eraser" ? this.eraser.size : this.brush.size;
    const previewSize = this.mode === "fill" || this.mode === "picker" || this.mode === "text" ? 22 : Math.max(6, size * scale);
    const color = this.mode === "eraser" ? "#64748b" : this.brush.color;
    const fill = this.mode === "eraser" ? "rgba(255, 255, 255, 0.55)" : `${this.brush.color}26`;
    this.preview.style.setProperty("--preview-size", `${previewSize}px`);
    this.preview.style.setProperty("--preview-color", color);
    this.preview.style.setProperty("--preview-fill", fill);
    this.preview.classList.toggle("fill-preview", this.mode === "fill" || this.mode === "picker" || this.mode === "text");
  }
  pickColor(point) {
    const imageData = this.context.getImageData(point.x, point.y, 1, 1);
    const [red, green, blue] = imageData.data;
    const color = this.rgbToHex(red, green, blue);
    this.brush.setColor(color);
    this.pickedColorHandler(color);
    this.updatePreviewStyle();
    this.statusHandler(`Picked color ${color}.`);
  }
  fill(point) {
    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const result = floodFill(imageData, point.x, point.y, hexToRgba(this.brush.color));
    this.context.putImageData(result.imageData, 0, 0);
    this.history.add({ color: this.brush.color, point, tool: "fill" });
    this.statusHandler(`Filled ${result.changedPixels} pixels.`);
  }
  renderHistory() {
    this.prepareCanvas();
    this.strokes.length = 0;
    this.coordinates.length = 0;
    for (const action of this.history.actions) {
      if (action.tool === "fill") {
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
  renderStroke(action) {
    if (action.points.length === 0) {
      return;
    }
    this.context.strokeStyle = action.color;
    this.context.fillStyle = action.color;
    this.context.lineWidth = action.size;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.beginPath();
    this.context.moveTo(action.points[0].x, action.points[0].y);
    for (const point of action.points.slice(1)) {
      this.context.lineTo(point.x, point.y);
    }
    this.context.stroke();
    this.drawCircle(action.points[0], action.size / 2, action.color);
  }
  createShapeAction(start, end, tool) {
    return {
      color: this.brush.color,
      end,
      size: this.brush.size,
      start,
      tool
    };
  }
  renderShape(action) {
    this.context.strokeStyle = action.color;
    this.context.lineWidth = action.size;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.beginPath();
    if (action.tool === "line") {
      this.context.moveTo(action.start.x, action.start.y);
      this.context.lineTo(action.end.x, action.end.y);
    }
    if (action.tool === "circle") {
      const radius = Math.hypot(action.end.x - action.start.x, action.end.y - action.start.y);
      this.context.arc(action.start.x, action.start.y, radius, 0, Math.PI * 2);
    }
    if (action.tool === "square") {
      const width = action.end.x - action.start.x;
      const height = action.end.y - action.start.y;
      const side = Math.max(Math.abs(width), Math.abs(height));
      const xDirection = width < 0 ? -1 : 1;
      const yDirection = height < 0 ? -1 : 1;
      this.context.rect(action.start.x, action.start.y, side * xDirection, side * yDirection);
    }
    this.context.stroke();
  }
  renderText(action) {
    this.context.fillStyle = action.color;
    this.context.font = `${action.size}px Arial, sans-serif`;
    this.context.textBaseline = "top";
    const lines = this.wrapText(action.text, action.width, action.size);
    const lineHeight = action.size * 1.2;
    lines.forEach((line, index) => {
      const y = action.point.y + index * lineHeight;
      if (y <= action.point.y + action.height - action.size) {
        this.context.fillText(line, action.point.x, y);
      }
    });
  }
  createTextEditor(start, end) {
    const box = this.getCanvasBox(start, end);
    const screenBox = this.canvasBoxToScreenBox(box);
    const editor = document.createElement("textarea");
    const textSize = this.getTextSize();
    editor.className = "text-editor";
    editor.style.left = `${screenBox.left}px`;
    editor.style.top = `${screenBox.top}px`;
    editor.style.width = `${screenBox.width}px`;
    editor.style.height = `${screenBox.height}px`;
    editor.style.color = this.brush.color;
    editor.style.fontSize = `${textSize * screenBox.scaleX}px`;
    editor.placeholder = "Type here";
    editor.addEventListener("blur", () => this.removeEditor(true));
    editor.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.removeEditor(false);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        this.removeEditor(true);
      }
    });
    document.body.appendChild(editor);
    this.editorElement = editor;
    this.hidePreview();
    editor.focus();
  }
  removeEditor(shouldCommit) {
    if (!this.editorElement) {
      return;
    }
    const editor = this.editorElement;
    this.editorElement = null;
    if (shouldCommit && editor.value.trim().length > 0) {
      const box = this.screenBoxToCanvasBox(editor.getBoundingClientRect());
      const action = {
        color: this.brush.color,
        height: box.height,
        point: { x: box.x, y: box.y },
        size: this.getTextSize(),
        text: editor.value.trim(),
        tool: "text",
        width: box.width
      };
      this.history.add(action);
      this.renderHistory();
      this.statusHandler("Text added to canvas.");
    }
    editor.remove();
  }
  showTextSelection(start, end) {
    if (!this.selectionElement) {
      this.selectionElement = document.createElement("div");
      this.selectionElement.className = "text-selection";
      document.body.appendChild(this.selectionElement);
    }
    const screenBox = this.canvasBoxToScreenBox(this.getCanvasBox(start, end));
    this.selectionElement.style.left = `${screenBox.left}px`;
    this.selectionElement.style.top = `${screenBox.top}px`;
    this.selectionElement.style.width = `${screenBox.width}px`;
    this.selectionElement.style.height = `${screenBox.height}px`;
  }
  removeTextSelection() {
    if (!this.selectionElement) {
      return;
    }
    this.selectionElement.remove();
    this.selectionElement = null;
  }
  applyStrokeStyle() {
    const color = this.mode === "eraser" ? "#ffffff" : this.brush.color;
    const size = this.mode === "eraser" ? this.eraser.size : this.brush.size;
    this.context.strokeStyle = color;
    this.context.fillStyle = color;
    this.context.lineWidth = size;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
  }
  drawPoint(point) {
    const color = this.mode === "eraser" ? "#ffffff" : this.brush.color;
    const size = this.mode === "eraser" ? this.eraser.size : this.brush.size;
    this.drawCircle(point, size / 2, color);
  }
  drawCircle(point, radius, color) {
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.context.fill();
  }
  isShapeMode(mode) {
    return mode === "circle" || mode === "line" || mode === "square";
  }
  isShapeAction(action) {
    return action.tool === "circle" || action.tool === "line" || action.tool === "square";
  }
  isTextAction(action) {
    return action.tool === "text";
  }
  getTextSize() {
    return Math.max(12, this.brush.size * 3);
  }
  getCanvasBox(start, end) {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.max(80, Math.abs(end.x - start.x));
    const height = Math.max(40, Math.abs(end.y - start.y));
    return { height, width, x, y };
  }
  canvasBoxToScreenBox(box) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / this.canvas.width;
    const scaleY = rect.height / this.canvas.height;
    return {
      height: box.height * scaleY,
      left: rect.left + box.x * scaleX,
      scaleX,
      scaleY,
      top: rect.top + box.y * scaleY,
      width: box.width * scaleX
    };
  }
  screenBoxToCanvasBox(rect) {
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
  wrapText(text, maxWidth, fontSize) {
    this.context.font = `${fontSize}px Arial, sans-serif`;
    const lines = [];
    const paragraphs = text.split("\n");
    for (const paragraph of paragraphs) {
      const words = paragraph.split(" ");
      let line = "";
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
  rgbToHex(red, green, blue) {
    return `#${this.colorPartToHex(red)}${this.colorPartToHex(green)}${this.colorPartToHex(blue)}`;
  }
  colorPartToHex(value) {
    return value.toString(16).padStart(2, "0");
  }
  getCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: Math.floor((event.clientX - rect.left) * scaleX),
      y: Math.floor((event.clientY - rect.top) * scaleY)
    };
  }
  prepareCanvas() {
    this.context.fillStyle = "#ffffff";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  async canvasToImageUrl() {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (!blob) {
          reject(new DrawingAppError("Canvas data is missing."));
          return;
        }
        resolve(URL.createObjectURL(blob));
      }, "image/png");
    });
  }
  tryAction(action) {
    try {
      action();
    } catch (error) {
      this.handleError(error);
    }
  }
  async tryAsyncAction(action) {
    try {
      await action();
    } catch (error) {
      this.handleError(error);
    }
  }
  handleError(error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    this.statusHandler(message, true);
  }
};

// src/main.ts
var canvas = document.querySelector("#drawingCanvas");
var statusMessage = document.querySelector("#statusMessage");
var brushColor = document.querySelector("#brushColor");
var brushSize = document.querySelector("#brushSize");
var brushSizeValue = document.querySelector("#brushSizeValue");
var zoomValue = document.querySelector("#zoomValue");
var brushButton = document.querySelector("#brushButton");
var eraserButton = document.querySelector("#eraserButton");
var fillButton = document.querySelector("#fillButton");
var pickerButton = document.querySelector("#pickerButton");
var lineButton = document.querySelector("#lineButton");
var circleButton = document.querySelector("#circleButton");
var squareButton = document.querySelector("#squareButton");
var textButton = document.querySelector("#textButton");
var clearButton = document.querySelector("#clearButton");
var undoButton = document.querySelector("#undoButton");
var redoButton = document.querySelector("#redoButton");
var saveDrawingButton = document.querySelector("#saveDrawingButton");
var loadDrawingButton = document.querySelector("#loadDrawingButton");
var saveImageButton = document.querySelector("#saveImageButton");
var brushPreview = document.querySelector("#brushPreview");
var zoomOutButton = document.querySelector("#zoomOutButton");
var zoomResetButton = document.querySelector("#zoomResetButton");
var zoomInButton = document.querySelector("#zoomInButton");
if (!canvas || !statusMessage || !brushColor || !brushSize || !brushSizeValue || !zoomValue || !brushButton || !eraserButton || !fillButton || !pickerButton || !lineButton || !circleButton || !squareButton || !textButton || !clearButton || !undoButton || !redoButton || !saveDrawingButton || !loadDrawingButton || !saveImageButton || !brushPreview || !zoomOutButton || !zoomResetButton || !zoomInButton) {
  throw new Error("The application could not find all required page elements.");
}
var drawingCanvas = canvas;
var zoomLabel = zoomValue;
var zoomReset = zoomResetButton;
var app = new DrawingApp(drawingCanvas, (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#b91c1c" : "#546179";
}, brushPreview, (color) => {
  brushColor.value = color;
});
var toolButtons = [brushButton, eraserButton, fillButton, pickerButton, lineButton, circleButton, squareButton, textButton];
var zoomLevel = 1;
function setActiveTool(activeButton) {
  for (const button of toolButtons) {
    button.classList.toggle("active", button === activeButton);
  }
}
function setZoom(nextZoom) {
  zoomLevel = Math.min(2, Math.max(0.4, nextZoom));
  drawingCanvas.style.setProperty("--canvas-display-width", `${drawingCanvas.width * zoomLevel}px`);
  zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
  zoomReset.textContent = `${Math.round(zoomLevel * 100)}%`;
  app.refreshPreview();
}
brushColor.addEventListener("input", () => app.setColor(brushColor.value));
brushSize.addEventListener("input", () => {
  const nextSize = Number.parseInt(brushSize.value, 10);
  brushSizeValue.textContent = nextSize.toString();
  app.setSize(nextSize);
});
zoomOutButton.addEventListener("click", () => setZoom(zoomLevel - 0.1));
zoomResetButton.addEventListener("click", () => setZoom(1));
zoomInButton.addEventListener("click", () => setZoom(zoomLevel + 0.1));
brushButton.addEventListener("click", () => {
  app.setMode("brush");
  setActiveTool(brushButton);
});
eraserButton.addEventListener("click", () => {
  app.setMode("eraser");
  setActiveTool(eraserButton);
});
fillButton.addEventListener("click", () => {
  app.setMode("fill");
  setActiveTool(fillButton);
});
pickerButton.addEventListener("click", () => {
  app.setMode("picker");
  setActiveTool(pickerButton);
});
lineButton.addEventListener("click", () => {
  app.setMode("line");
  setActiveTool(lineButton);
});
circleButton.addEventListener("click", () => {
  app.setMode("circle");
  setActiveTool(circleButton);
});
squareButton.addEventListener("click", () => {
  app.setMode("square");
  setActiveTool(squareButton);
});
textButton.addEventListener("click", () => {
  app.setMode("text");
  setActiveTool(textButton);
});
clearButton.addEventListener("click", () => app.clear());
undoButton.addEventListener("click", () => app.undo());
redoButton.addEventListener("click", () => app.redo());
saveDrawingButton.addEventListener("click", () => void app.saveDrawing());
loadDrawingButton.addEventListener("click", () => void app.loadDrawing());
saveImageButton.addEventListener("click", () => void app.saveImage());
document.querySelectorAll(".swatch").forEach((button) => {
  button.addEventListener("click", () => {
    const color = button.dataset.color;
    if (color) {
      brushColor.value = color;
      app.setColor(color);
    }
  });
});
