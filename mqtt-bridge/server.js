import express from "express";
import bodyParser from "body-parser";
import mqtt from "mqtt";

const app = express();
app.use(bodyParser.json());

// חיבור ל-Broker ציבורי (Mosquitto)
const mqttClient = mqtt.connect("mqtt://mqtt.eclipseprojects.io:1883");

let lastResponse = "";

// התחברות ל-Broker ומנוי לנושא התשובה
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("test/pong");
});

mqttClient.on("message", (topic, message) => {
  if (topic === "test/pong") {
    lastResponse = message.toString();
    console.log("Got response from NodeMCU:", lastResponse);
  }
});

// פרסום הודעה ל-MQTT (למשל "PING")
app.post("/publish", (req, res) => {
  const { topic, message } = req.body;
  if (!topic || !message) return res.status(400).send("Missing topic or message");
  mqttClient.publish(topic, message);
  res.send("Published");
});

// קבלת תשובה מ-MQTT ("PONG")
app.get("/consume", (req, res) => {
  if (lastResponse) {
    const response = lastResponse;
    lastResponse = ""; // מאפס אחרי קריאה
    return res.send(response);
  }
  res.status(204).send("");
});

// הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MQTT Bridge running on port ${PORT}`));