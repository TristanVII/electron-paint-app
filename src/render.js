import { WebSocketManager } from "./websocket/websocket.js";

class Context {
  constructor(document) {
    this.isDrawing = false;
    this.document = document;
    this.canvas = this.document.getElementById("canvas");
    this.ctx = canvas.getContext("2d");
    this.currentStroke = [];
    this.canvasState = [];
    this.canvasUndoState = [];
    this.webSocketManager = new WebSocketManager(this.drawLines.bind(this));

    // Documents
    this.colorPicker = document.getElementById("color-picker");
    this.toolSelector = document.getElementById("toolSelector");
    this.brushSelector = document.getElementById("brushSelector");

    // CTX properties
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = this.colorPicker.getAttribute("data-current-color");

    // Watches
    this.setWatches();
    this.setObservers();
  }

  setWatches() {
    this.toolSelector.onchange = (event) => {
      const choice = event.target.value;
      if (choice === "eraser") {
        this.ctx.strokeStyle = "#FFF";
      } else {
        this.ctx.strokeStyle =
          this.colorPicker.getAttribute("data-current-color");
      }
    };

    this.brushSelector.onchange = (event) => {
      const choice = event.target.value;
      this.ctx.lineWidth = parseInt(choice);
    };

    this.document.addEventListener("paste", async (ev) => {
      if (!ev.clipboardData?.items?.length) return;
      const { items } = ev.clipboardData;
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        const bitmap = await createImageBitmap(file);
        this.ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
      }
    });

    this.canvas.addEventListener("mousedown", (e) => this.startDrawing(e));
    this.canvas.addEventListener("mousemove", (e) => this.draw(e));
    this.canvas.addEventListener("mouseup", (e) => this.stopDrawing(e));
    this.document.addEventListener("mousemove", (e) => this.checkMouse(e));
    this.document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  startDrawing(e) {
    this.isDrawing = true;
    this.draw(e);
  }

  draw(e) {
    if (!this.isDrawing) {
      return;
    }

    const { x, y } = this.getMousePos(e);

    const strokeObj = {
      x: x,
      y: y,
      lineWidth: this.ctx.lineWidth,
      strokeStyle: this.ctx.strokeStyle,
    };
    if (this.webSocketManager.isReady) {
      this.webSocketManager.sendMessage(
        JSON.stringify({
          message_type: "drawing",
          content: {
            id: this.webSocketManager.id,
            room_id: this.webSocketManager.roomId,
            data: { ...strokeObj },
          },
        })
      );
      return;
    }
    this.currentStroke.push(strokeObj);
    this.drawLines(strokeObj);
  }

  drawLines({ x, y, lineWidth, strokeStyle }) {
    const originalWidth = this.ctx.lineWidth;
    const originalStroke = this.ctx.strokeStyle;
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.moveTo(x, y);

    this.ctx.lineWidth = originalWidth;
    this.ctx.strokeStyle = originalStroke;
  }

  stopDrawing() {
    this.isDrawing = false;
    this.ctx.beginPath();
    if (this.currentStroke.length > 0) {
      this.canvasState.push(this.currentStroke);
      this.currentStroke = [];
    }
  }

  checkMouse(e) {
    if (!e) {
      return;
    }
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (
      e.clientX < 1 ||
      e.clientX > screenWidth - 1 ||
      e.clientY < 1 ||
      e.clientY > screenHeight - 1
    ) {
      this.stopDrawing();
    }
  }

  getMousePos(e) {
    if (!e) {
      throw new Error("No event, cant find mouse position");
    }
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return { x: mouseX, y: mouseY };
  }

  setObservers() {
    return new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-current-color"
        ) {
          // The data-current-color attribute has changed
          const newColor = this.colorPicker.getAttribute("data-current-color");
          this.ctx.strokeStyle = newColor;
          this.toolSelector.value = "pen";
        }
      }
    }).observe(this.colorPicker, { attributes: true });
  }

  undoLastStroke() {
    if (this.canvasState.length === 0) {
      return;
    }
    this.resetPage();
    this.canvasUndoState.push(this.canvasState.pop());

    this.canvasState.forEach((state) =>
      state.forEach((line) => {
        this.drawLines(line);
      })
    );
  }

  redoLastUndo() {
    if (this.canvasUndoState.length === 0) {
      return;
    }
    const lastStroke = this.canvasUndoState.pop();
    this.canvasState.push(lastStroke);
    lastStroke.forEach((line) => this.drawLines(line));
  }

  resetPage() {
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      // Check for the "Control" (or "Command" on Mac) key
      if (e.key === "z" || e.keyCode === 90) {
        // Check for the "Z" key
        e.preventDefault(); // Prevent the default browser behavior (e.g., undoing text input)

        // Handle the "Control + Z" key press
        if (e.shiftKey) {
          this.redoLastUndo();
        } else {
          this.undoLastStroke();
        }
      }
    }
  }
}

const context = new Context(document);
export { context };
