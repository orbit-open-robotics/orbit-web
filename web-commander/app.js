// TODO: add device selector
// TODO: save / restore code to/from local storage (named code?)
// Download / upload code
// If code is too long for MQTT, break it into pieces.


import { createPythonEditor, getCode, setCode } from './editor.js';

const statusDisplay = document.getElementById("status-display");
const sendButton = document.getElementById("send-button");
sendButton.addEventListener("click", send);
const clearLogButton = document.getElementById("clear-log-button");
clearLogButton.addEventListener("click", clearLog);

// Create the editor
const editor = createPythonEditor(
  document.getElementById('editor-container'),
  `print("Hello, Pico!")\n`
);

// --- MQTT setup ---
const BROKER = "broker.hivemq.com"; 
const PORT = 8884;               // WSS port
const TOPIC_TX = "orbit_pico/command";    // laptop → Pico
const TOPIC_RX = "orbit_pico/response";  // Pico → laptop
const clientId = "webclient_" + Math.random().toString(16).slice(2, 8);
const client = new Paho.Client(BROKER, PORT, clientId);

client.onConnectionLost = (res) => {
    setStatus("disconnected", "Disconnected: " + res.errorMessage);
    sendButton.disabled = true;
    log("Connection lost — retrying in 5s...");
    setTimeout(connect, 5000);
};

client.onMessageArrived = (message) => {
    log("Received: " + message.payloadString);
    // receivedMessageInput.value = message.payloadString;
};

// --- Connect to broker ---
function connect() {
    log("Connecting to broker...");
    client.connect({
        useSSL: true,
        onSuccess: () => {
            setStatus("connected", "Connected to broker");
            client.subscribe(TOPIC_RX);
            log("Connected! Subscribed to " + TOPIC_RX);
        },
        onFailure: (err) => {
            log("Connection failed: " + err.errorMessage);
            setTimeout(connect, 5000);
        }
    });
}  

function send() {
    const text = getCode(editor);
    if (!text) { log("Nothing to send."); return; }
    const message = new Paho.Message(text);
    message.destinationName = TOPIC_TX;
    client.send(message);
    log("Sent " + message.payloadString.length + " bytes to " + TOPIC_TX);
    setStatus("sent", `Message sent to ${TOPIC_TX}`);
}

function setStatus(type, text) {
    statusDisplay.className = type;
    statusDisplay.textContent = text;
}

// --- Logging ---
function log(msg) {
    const div = document.getElementById("log");
    const time = new Date().toLocaleTimeString();
    div.innerHTML += `<div>[${time}] ${msg}</div>`;
    div.scrollTop = div.scrollHeight;
}

function clearLog() {
    document.getElementById("log").innerHTML = "";
}

connect();

// Write new code into the editor:
// setCode(editor, "print('replaced!')");
