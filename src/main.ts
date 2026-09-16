import { DrawingApp } from './DrawingApp';

const canvas = document.querySelector<HTMLCanvasElement>('#drawingCanvas');
const statusMessage = document.querySelector<HTMLParagraphElement>('#statusMessage');
const brushColor = document.querySelector<HTMLInputElement>('#brushColor');
const brushSize = document.querySelector<HTMLInputElement>('#brushSize');
const brushSizeValue = document.querySelector<HTMLSpanElement>('#brushSizeValue');
const zoomValue = document.querySelector<HTMLSpanElement>('#zoomValue');
const brushButton = document.querySelector<HTMLButtonElement>('#brushButton');
const eraserButton = document.querySelector<HTMLButtonElement>('#eraserButton');
const fillButton = document.querySelector<HTMLButtonElement>('#fillButton');
const pickerButton = document.querySelector<HTMLButtonElement>('#pickerButton');
const lineButton = document.querySelector<HTMLButtonElement>('#lineButton');
const circleButton = document.querySelector<HTMLButtonElement>('#circleButton');
const squareButton = document.querySelector<HTMLButtonElement>('#squareButton');
const textButton = document.querySelector<HTMLButtonElement>('#textButton');
const clearButton = document.querySelector<HTMLButtonElement>('#clearButton');
const undoButton = document.querySelector<HTMLButtonElement>('#undoButton');
const redoButton = document.querySelector<HTMLButtonElement>('#redoButton');
const saveDrawingButton = document.querySelector<HTMLButtonElement>('#saveDrawingButton');
const loadDrawingButton = document.querySelector<HTMLButtonElement>('#loadDrawingButton');
const saveImageButton = document.querySelector<HTMLButtonElement>('#saveImageButton');
const brushPreview = document.querySelector<HTMLDivElement>('#brushPreview');
const zoomOutButton = document.querySelector<HTMLButtonElement>('#zoomOutButton');
const zoomResetButton = document.querySelector<HTMLButtonElement>('#zoomResetButton');
const zoomInButton = document.querySelector<HTMLButtonElement>('#zoomInButton');

if (!canvas || !statusMessage || !brushColor || !brushSize || !brushSizeValue || !zoomValue || !brushButton || !eraserButton || !fillButton || !pickerButton || !lineButton || !circleButton || !squareButton || !textButton || !clearButton || !undoButton || !redoButton || !saveDrawingButton || !loadDrawingButton || !saveImageButton || !brushPreview || !zoomOutButton || !zoomResetButton || !zoomInButton) {
  throw new Error('The application could not find all required page elements.');
}

const drawingCanvas = canvas;
const zoomLabel = zoomValue;
const zoomReset = zoomResetButton;

const app = new DrawingApp(drawingCanvas, (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#b91c1c' : '#546179';
}, brushPreview, (color) => {
  brushColor.value = color;
});

const toolButtons = [brushButton, eraserButton, fillButton, pickerButton, lineButton, circleButton, squareButton, textButton];
let zoomLevel = 1;

function setActiveTool(activeButton: HTMLButtonElement): void {
  for (const button of toolButtons) {
    button.classList.toggle('active', button === activeButton);
  }
}

function setZoom(nextZoom: number): void {
  zoomLevel = Math.min(2, Math.max(0.4, nextZoom));
  drawingCanvas.style.setProperty('--canvas-display-width', `${drawingCanvas.width * zoomLevel}px`);
  zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
  zoomReset.textContent = `${Math.round(zoomLevel * 100)}%`;
  app.refreshPreview();
}

brushColor.addEventListener('input', () => app.setColor(brushColor.value));
brushSize.addEventListener('input', () => {
  const nextSize = Number.parseInt(brushSize.value, 10);
  brushSizeValue.textContent = nextSize.toString();
  app.setSize(nextSize);
});

zoomOutButton.addEventListener('click', () => setZoom(zoomLevel - 0.1));
zoomResetButton.addEventListener('click', () => setZoom(1));
zoomInButton.addEventListener('click', () => setZoom(zoomLevel + 0.1));

brushButton.addEventListener('click', () => {
  app.setMode('brush');
  setActiveTool(brushButton);
});

eraserButton.addEventListener('click', () => {
  app.setMode('eraser');
  setActiveTool(eraserButton);
});

fillButton.addEventListener('click', () => {
  app.setMode('fill');
  setActiveTool(fillButton);
});

pickerButton.addEventListener('click', () => {
  app.setMode('picker');
  setActiveTool(pickerButton);
});

lineButton.addEventListener('click', () => {
  app.setMode('line');
  setActiveTool(lineButton);
});

circleButton.addEventListener('click', () => {
  app.setMode('circle');
  setActiveTool(circleButton);
});

squareButton.addEventListener('click', () => {
  app.setMode('square');
  setActiveTool(squareButton);
});

textButton.addEventListener('click', () => {
  app.setMode('text');
  setActiveTool(textButton);
});

clearButton.addEventListener('click', () => app.clear());
undoButton.addEventListener('click', () => app.undo());
redoButton.addEventListener('click', () => app.redo());
saveDrawingButton.addEventListener('click', () => void app.saveDrawing());
loadDrawingButton.addEventListener('click', () => void app.loadDrawing());
saveImageButton.addEventListener('click', () => void app.saveImage());

document.querySelectorAll<HTMLButtonElement>('.swatch').forEach((button) => {
  button.addEventListener('click', () => {
    const color = button.dataset.color;

    if (color) {
      brushColor.value = color;
      app.setColor(color);
    }
  });
});
