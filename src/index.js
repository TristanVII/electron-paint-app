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
  } catch (error) {
    // notify front end error
    return;
  }

  document.getElementById("ws-disconnect").style.display = "block";
  document.getElementById("ws-create").style.display = "none";
}

function disconnectRoom() {
  if (!context.webSocketManager.isReady) {
    return;
  }
  context.webSocketManager.disconnect();
  document.getElementById("ws-disconnect").style.display = "none";
  const htmlId = document.getElementById("room-id");
  htmlId.innerHTML = ``;
}

function joinRoom() {
  if (context.webSocketManager.isReady) {
    disconnectRoom();
  }
  console.log(document.getElementById("join-room"));
  let roomId = document.getElementById("join-room").value;
  console.log(roomId);

  if (roomId == null) {
    return;
  }
  console.log("Joining");
  context.webSocketManager.joinRoom(roomId);
  const htmlId = document.getElementById("room-id");
  htmlId.innerHTML = `Room ID: ${roomId}`;

  document.getElementById("ws-disconnect").style.display = "block";
}
