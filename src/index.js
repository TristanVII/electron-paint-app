import { context } from "./render.js";

onclick = "mockSendMessage()";

context.setErrorCB((errorMessage) => {
  alert(`${errorMessage}`);
  context.disconnectRoom();
});

document.addEventListener("DOMContentLoaded", () => {
  const deleteButton = document.getElementById("reset-button");
  deleteButton.addEventListener("click", () => {
    resetPage();
  });

  const connectButton = document.getElementById("ws-create");
  connectButton.addEventListener("click", async () => {
    await createRoom();
  });

  const disconnect = document.getElementById("ws-disconnect");
  disconnect.addEventListener("click", () => {
    disconnectRoom();
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

async function createRoom() {
  try {
    const roomId = await context.webSocketManager.connect();
    const htmlId = document.getElementById("room-id");
    htmlId.innerHTML = `Room ID: ${roomId}`;
    context.resetPage();
  } catch (error) {
    // notify front end error
    console.log(error);
    alert("Could not connect to Server");
    return;
  }

  document.getElementById("join-room").style.display = "none";
  document.getElementById("ws-disconnect").style.display = "block";
  document.getElementById("ws-create").style.display = "none";
}

function disconnectRoom() {
  if (!context.webSocketManager.isReady) {
    return;
  }

  document.getElementById("ws-create").style.display = "block";
  document.getElementById("join-room").style.display = "block";
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
  document.getElementById("ws-create").style.display = "none";
}

context.setErrorCB((errorMessage) => {
  alert(`${errorMessage}`);
  disconnectRoom();
});
