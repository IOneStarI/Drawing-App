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

const app = new DrawingApp(drawingCanvas, /** Updates the visible status message and error color. */ (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#b91c1c' : '#546179';
}, brushPreview, /** Synchronizes the color input with the sampled canvas color. */ (color) => {
  brushColor.value = color;
});

const toolButtons = [brushButton, eraserButton, fillButton, pickerButton, lineButton, circleButton, squareButton, textButton];
let zoomLevel = 1;

/** Highlights the selected tool button and removes highlighting from the others. */
function setActiveTool(activeButton: HTMLButtonElement): void {
  for (const button of toolButtons) {
    button.classList.toggle('active', button === activeButton);
  }
}

/** Clamps zoom to 40–200 percent and updates the displayed canvas, labels, and tool preview. */
function setZoom(nextZoom: number): void {
  zoomLevel = Math.min(2, Math.max(0.4, nextZoom));
  drawingCanvas.style.setProperty('--canvas-display-width', `${drawingCanvas.width * zoomLevel}px`);
  zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
  zoomReset.textContent = `${Math.round(zoomLevel * 100)}%`;
  app.refreshPreview();
}

brushColor.addEventListener('input', /** Handles 'input' events: applies the associated drawing or UI action. */ () => app.setColor(brushColor.value));
brushSize.addEventListener('input', /** Handles 'input' events: applies the associated drawing or UI action. */ () => {
  const nextSize = Number.parseInt(brushSize.value, 10);
  brushSizeValue.textContent = nextSize.toString();
  app.setSize(nextSize);
});

zoomOutButton.addEventListener('click', /** Handles 'click' events: updates canvas zoom. */ () => setZoom(zoomLevel - 0.1));
zoomResetButton.addEventListener('click', /** Handles 'click' events: updates canvas zoom. */ () => setZoom(1));
zoomInButton.addEventListener('click', /** Handles 'click' events: updates canvas zoom. */ () => setZoom(zoomLevel + 0.1));

brushButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('brush');
  setActiveTool(brushButton);
});

eraserButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('eraser');
  setActiveTool(eraserButton);
});

fillButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('fill');
  setActiveTool(fillButton);
});

pickerButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('picker');
  setActiveTool(pickerButton);
});

lineButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('line');
  setActiveTool(lineButton);
});

circleButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('circle');
  setActiveTool(circleButton);
});

squareButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('square');
  setActiveTool(squareButton);
});

textButton.addEventListener('click', /** Handles 'click' events: selects the tool and updates its button. */ () => {
  app.setMode('text');
  setActiveTool(textButton);
});

clearButton.addEventListener('click', /** Handles 'click' events: applies the associated drawing or UI action. */ () => app.clear());
undoButton.addEventListener('click', /** Handles 'click' events: applies the associated drawing or UI action. */ () => app.undo());
redoButton.addEventListener('click', /** Handles 'click' events: applies the associated drawing or UI action. */ () => app.redo());
saveDrawingButton.addEventListener('click', /** Handles 'click' events: applies the associated drawing or UI action. */ () => void app.saveDrawing());
loadDrawingButton.addEventListener('click', /** Handles 'click' events: applies the associated drawing or UI action. */ () => void app.loadDrawing());
saveImageButton.addEventListener('click', /** Handles 'click' events: applies the associated drawing or UI action. */ () => void app.saveImage());

document.querySelectorAll<HTMLButtonElement>('.swatch').forEach(/** Connects a palette swatch to brush color selection. */ (button) => {
  button.addEventListener('click', /** Handles 'click' events: applies the associated drawing or UI action. */ () => {
    const color = button.dataset.color;

    if (color) {
      brushColor.value = color;
      app.setColor(color);
    }
  });
});
