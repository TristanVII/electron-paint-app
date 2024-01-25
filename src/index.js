import { context } from "./render.js";

onclick = "mockSendMessage()";

document.addEventListener("DOMContentLoaded", () => {
  const deleteButton = document.getElementById("reset-button");
  deleteButton.addEventListener("click", () => {
    resetPage();
  });

  const connectButton = document.getElementById("ws-connect");
  connectButton.addEventListener("click", () => {
    connectWS();
  });

  const button = document.getElementById("ws-message");
  button.addEventListener("click", () => {
    mockSendMessage();
  });
});

function resetPage() {
  context.resetPage();
  context.canvasState = [];
}

function connectWS() {
  try {
    context.webSocketManager.connect();
  } catch (error) {
    // notify error
    console.log(error.message);
  }
}

function mockSendMessage() {
  console.log("sending message");
  context.webSocketManager.sendMessage("TEST MESSAGE");
}
