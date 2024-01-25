import { uuidv4 } from "../utils/uuid.js";

const nullWsError = () => {
  throw new Error("No websocket connection");
};

export class WebSocketManager {
  constructor() {
    self.id = uuidv4();
    this._ws = null;
    this.isReady = false;
  }

  connect() {
    this._ws = this._connect();
    if (!this._ws) {
      return nullWsError();
    }
    this._setupEventListeners();
  }

  _connect() {
    return new WebSocket(`ws://localhost:3000/ws/${this.id}/test`);
  }

  _setupEventListeners() {
    if (!this._ws) {
      return nullWsError();
    }
    this._ws.onopen = () => {
      this.isReady = true;
      this._ws.setRequest;
    };
    this._ws.onmessage = (event) => {
      console.log("received: ", event.data);
    };

    this._ws.onerror = (error) => {
      console.log("on error, disconnection: ", error);
      this._ws.disconnect();
    };
  }

  sendMessage(content) {
    if (!this._ws || !this.isReady) {
      return nullWsError();
    }
    this._ws.send(content);
  }

  disconnect() {
    if (!this._ws) {
      return;
    }
    this._ws.disconnect();
    this._ws = null;
  }
}
