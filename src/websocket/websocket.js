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
    this.roomId = null;
  }

  connect(roomId) {
    const _roomId = roomId ? roomId : uuidv4();
    try {
      this._ws = this._connect(_roomId);
    } catch (error) {
      return nullWsError();
    }
    this._setupEventListeners();
    return _roomId;
  }

  _connect(roomId) {
    this.roomId = roomId;
    console.log("Creating WS connection: ", this.roomId);
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
      this._ws.close();
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
    const content = {
      message_type: "close",
      content: {
        id: this.id,
        room_id: this.roomId,
      },
    };
    this.sendMessage(JSON.stringify(content));
    this._ws.close();
    this._ws = null;
    this.roomId = null;
  }

  leaveRoom() {
    if (!this._ws || !this.roomId) {
      return;
    }
    const content = {
      message_type: "leave",
      content: {
        id: this.id,
        room_id: roomId,
      },
    };
    this.sendMessage(content);
  }

  joinRoom(roomId) {
    if (!this._ws || !this.isReady) {
      this.connect(roomId);
    } else {
      this.leaveRoom();
      const content = {
        message_type: "join",
        content: {
          id: this.id,
          room_id: roomId,
        },
      };

      this.sendMessage(JSON.stringify(content));
    }
  }
}
