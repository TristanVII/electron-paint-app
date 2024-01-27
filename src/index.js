import { context } from "./render.js";

onclick = "mockSendMessage()";

document.addEventListener("DOMContentLoaded", () => {
  const deleteButton = document.getElementById("reset-button");
  deleteButton.addEventListener("click", () => {
    resetPage();
  });

  const connectButton = document.getElementById("ws-create");
  connectButton.addEventListener("click", () => {
    createRoom();
  });

  const disconnect = document.getElementById("ws-disconnect");
  disconnect.addEventListener("click", () => {
    mockSendMessage();
  });

  const join = document.getElementById("ws-join");
  join.addEventListener("click", () => {
    joinRoom();
  });
});

function resetPage() {
  context.resetPage();
  context.canvasState = [];
}

function createRoom() {
  try {
    const roomId = context.webSocketManager.connect();
    const htmlId = document.getElementById("room-id");
    htmlId.innerHTML = `Room ID: ${roomId}`;
    document.getElementById("ws-create").style.display = "hidden";
    document.getElementById("ws-disconnect").style.display = "block";
  } catch (error) {
    // notify error
    console.log(error.message);
  }
}

function disconnectRoom() {}

function joinRoom() {
  if (context.webSocketManager.isReady) {
    disconnectRoom();
  }
  let roomId = prompt("Enter roomID to join");
  if (roomId != null) {
    // JOIN roomId
  }
}
