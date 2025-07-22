const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');

const app = express();
app.use(bodyParser.json());

// MQTT Broker
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
const TOPIC_NODEMCU = 'gate/nodemcu'; // NodeMCU → Render
const TOPIC_GAS = 'gate/gas';         // Render → NodeMCU

// משתנה לאחסון תשובה מה-NodeMCU
let lastResponse = null;

// התחברות ל-MQTT
mqttClient.on('connect', () => {
  console.log('Connected to HiveMQ broker');
  mqttClient.subscribe(TOPIC_NODEMCU, (err) => {
    if (err) console.error('Failed to subscribe:', err);
    else console.log(`Subscribed to ${TOPIC_NODEMCU}`);
  });
});

// מאזין להודעות מ-NodeMCU ושומר את התשובה
mqttClient.on('message', (topic, message) => {
  if (topic === TOPIC_NODEMCU) {
    lastResponse = message.toString();
    console.log(`NodeMCU responded: ${lastResponse}`);
  }
});

// API לשליחת פקודות וקבלת תשובה
app.post('/command', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).send('Missing command');

  lastResponse = null;

  mqttClient.publish(TOPIC_GAS, command, (err) => {
    if (err) {
      console.error('Failed to publish command:', err);
      return res.status(500).send('Failed to send command to NodeMCU');
    }
    console.log(`Command sent: ${command}`);
  });

  // מחכה עד 5 שניות לתשובה
  const start = Date.now();
  const interval = setInterval(() => {
    if (lastResponse) {
      clearInterval(interval);
      return res.send({ response: lastResponse });
    }
    if (Date.now() - start > 5000) {
      clearInterval(interval);
      return res.status(504).send('No response from NodeMCU');
    }
  }, 100);
});

// הפעלת שרת
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Bridge API running on port ${PORT}`);
});