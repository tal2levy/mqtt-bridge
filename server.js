const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');

const app = express();
app.use(bodyParser.json());

// פרטי MQTT Broker (HiveMQ)
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
const NODEMCU_TOPIC = 'gate/nodemcu'; // NodeMCU → GAS
const GAS_TOPIC = 'gate/gas';         // GAS → NodeMCU

console.log('Connecting to HiveMQ broker...');
mqttClient.on('connect', () => {
  console.log('Connected to HiveMQ broker');
  mqttClient.subscribe(NODEMCU_TOPIC, (err) => {
    if (err) console.error('Failed to subscribe:', err);
    else console.log(`Subscribed to ${NODEMCU_TOPIC}`);
  });
});

// משתנה זמני לאחסון תשובה מה-NodeMCU
let lastNodeMCUMessage = null;

// מאזין להודעות מ-NodeMCU
mqttClient.on('message', (topic, message) => {
  if (topic === NODEMCU_TOPIC) {
    lastNodeMCUMessage = message.toString();
    console.log(`Received from NodeMCU: ${lastNodeMCUMessage}`);
  }
});

// API ששולח פקודה ל-NodeMCU ומחכה לתשובה
app.post('/publish', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).send('Missing message');

  // מאפס תשובה ישנה
  lastNodeMCUMessage = null;

  // שולח פקודה ל-NodeMCU
  mqttClient.publish(GAS_TOPIC, message, (err) => {
    if (err) {
      console.error('MQTT publish failed:', err);
      return res.status(500).send('MQTT publish failed');
    }
    console.log(`Published to ${GAS_TOPIC}: ${message}`);
  });

  // מחכה עד 5 שניות לתשובה מה-NodeMCU
  const startTime = Date.now();
  const interval = setInterval(() => {
    if (lastNodeMCUMessage) {
      clearInterval(interval);
      return res.send(`NodeMCU responded: ${lastNodeMCUMessage}`);
    }
    if (Date.now() - startTime > 5000) {
      clearInterval(interval);
      return res.status(504).send('No response from NodeMCU');
    }
  }, 100);
});

// מאזין ל-Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`HTTP API running on port ${PORT}`);
});