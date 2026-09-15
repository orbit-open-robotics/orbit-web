const BROKER = "broker.hivemq.com"; 
const PORT = 8884;               // WSS port
const TOPIC_TX = "orbit_pico/command";    // laptop → Pico
const TOPIC_RX = "orbit_pico/response";  // Pico → laptop

const clientId = "webclient_" + Math.random().toString(16).slice(2, 8);
const client = new Paho.Client(BROKER, PORT, clientId);
let savedSubscribeTopic = TOPIC_RX;

// HTML elements
const publishTopicInput = document.getElementById("publish-topic-input");
const sendMessageInput = document.getElementById("send-message-input");
const subscribeTopicInput = document.getElementById("subscribe-topic-input");
const receivedMessageInput = document.getElementById("recieved-message-input");
const sendButton = document.getElementById("send-button");
const statusDisplay = document.getElementById("status-display");
const body = document.body;

subscribeTopicInput.onchange = () => {
    client.unsubscribe(savedSubscribeTopic);
    savedSubscribeTopic = subscribeTopicInput.value;
    client.subscribe(savedSubscribeTopic);
    log("Subscribed to " + savedSubscribeTopic);
};

body.onkeydown = (event) => {
    if (event.key === "Enter") {
        send();
    }
};


// Initialize UI elements
function initialize() {
    receivedMessageInput.value = "";
    receivedMessageInput.readOnly = true;
    subscribeTopicInput.value = TOPIC_RX;
    publishTopicInput.value = TOPIC_TX;
    sendButton.disabled = true;
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

// --- MQTT callbacks ---
client.onConnectionLost = (res) => {
    setStatus("disconnected", "Disconnected: " + res.errorMessage);
    sendButton.disabled = true;
    log("Connection lost — retrying in 5s...");
    setTimeout(connect, 5000);
};

client.onMessageArrived = (message) => {
    log("Received: " + message.payloadString);
    receivedMessageInput.value = message.payloadString;
};


function connect() {
    log("Connecting to broker...");
    client.connect({
        useSSL: true,
        onSuccess: () => {
            setStatus("connected", "Connected to broker");
            sendButton.disabled = false;
            savedSubscribeTopic = subscribeTopicInput.value;
            client.subscribe(savedSubscribeTopic);
            log("Connected! Subscribed to " + savedSubscribeTopic);
        },
        onFailure: (err) => {
            log("Connection failed: " + err.errorMessage);
            setTimeout(connect, 5000);
        }
    });
}   

function send() {
    const text = sendMessageInput.value;
    if (!text) { log("Nothing to send."); return; }
    const message = new Paho.Message(text);
    const publish_topic = publishTopicInput.value;
    message.destinationName = publish_topic;
    client.send(message);
    log("Sent " + message.payloadString.length + " bytes to " + publish_topic);
    setStatus("sent", `Code sent to ${publish_topic}`);
}

function setStatus(type, text) {
    statusDisplay.className = type;
    statusDisplay.textContent = text;
}

// --- Start ---
initialize();
connect();


