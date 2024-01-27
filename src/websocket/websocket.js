import { uuidv4 } from "../utils/uuid.js";

const nullWsError = () => {
  throw new Error("No websocket connection");
};

export class WebSocketManager {
  constructor(messageCB) {
    this.id = uuidv4();
    this._ws = null;
    this.isReady = false;
    this.messageCB = messageCB;
  }

  connect() {
    const roomId = uuidv4();
    this._ws = this._connect(roomId);
    if (!this._ws) {
      return nullWsError();
    }
    this._setupEventListeners();
    return roomId;
  }

  _connect(roomId) {
    return new WebSocket(`ws://localhost:3000/ws/${this.id}/${roomId}`);
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
      const data = JSON.parse(event.data);
      this.messageCB(data);
    };

    this._ws.onerror = (error) => {
      console.log("on error, disconnection: ", error);
      this._ws.disconnect();
    };
  }

  // TODO: maybe have specific type
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
