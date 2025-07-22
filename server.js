const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// פרטי MQTT Broker (HiveMQ ציבורי)
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
const NODEMCU_TOPIC = 'gate/nodemcu'; // NodeMCU → GAS
const GAS_TOPIC = 'gate/gas';         // GAS → NodeMCU

// כתובת ה-Webhook של GAS (להכניס את הכתובת האמיתית שלך)
const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';

// התחברות ל-MQTT Broker
mqttClient.on('connect', () => {
  console.log('Connected to HiveMQ broker');
  mqttClient.subscribe(NODEMCU_TOPIC, (err) => {
    if (err) console.error('Failed to subscribe:', err);
    else console.log(`Subscribed to ${NODEMCU_TOPIC}`);
  });
});

// כאשר מתקבלת הודעה מ-NodeMCU → מעבירים ל-GAS
mqttClient.on('message', async (topic, message) => {
  const payload = message.toString();
  console.log(`MQTT message from NodeMCU: ${payload}`);

  try {
    await axios.post(GAS_WEBHOOK_URL, { topic, payload });
    console.log('Forwarded to GAS successfully');
  } catch (err) {
    console.error('Failed to forward to GAS:', err.message);
  }
});

// API לשליחת פקודות ל-NodeMCU (GAS → MQTT)
app.post('/publish', (req, res) => {
  const { topic, message } = req.body;
  if (!topic || !message) {
    return res.status(400).send('Missing topic or message');
  }
  mqttClient.publish(topic, message, (err) => {
    if (err) {
      console.error('Publish failed:', err);
      return res.status(500).send('MQTT publish failed');
    }
    console.log(`Published to ${topic}: ${message}`);
    res.send(`Published to ${topic}: ${message}`);
  });
});

// הפעלת ה-API
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`HTTP API running on port ${PORT}`);
});