const mqtt = require("mqtt");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ברוקר HiveMQ ציבורי
const MQTT_BROKER = "mqtt://broker.hivemq.com:1883";
const TOPIC_NODEMCU = "gate/nodemcu";  // NodeMCU → GAS
const TOPIC_GAS = "gate/gas";          // GAS → NodeMCU

// כתובת ה־Webhook של GAS (החלף לכתובת האמיתית שלך!)
const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";

// התחברות לברוקר
console.log("Connecting to HiveMQ broker...");
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log("Connected to HiveMQ broker");
  client.subscribe(TOPIC_NODEMCU, (err) => {
    if (err) console.error("Subscription error:", err);
    else console.log(`Subscribed to topic: ${TOPIC_NODEMCU}`);
  });
});

// כל הודעה שמגיעה מ־NodeMCU → מועברת ל־GAS
client.on("message", async (topic, message) => {
  const payload = message.toString();
  console.log(`Message from NodeMCU on ${topic}: ${payload}`);

  try {
    await axios.post(GAS_WEBHOOK_URL, { topic, payload });
    console.log("Forwarded to GAS successfully");
  } catch (error) {
    console.error("Failed to forward to GAS:", error.message);
  }
});

// API שיאפשר ל־GAS לשלוח פקודות לנושא gate/gas
app.post("/send-command", (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).send("Missing command");

  client.publish(TOPIC_GAS, command, () => {
    console.log(`Command sent to NodeMCU via ${TOPIC_GAS}: ${command}`);
  });

  res.send("Command sent");
});

// הפעלת ה־API ב־Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`HTTP API running on port ${PORT}`);
});