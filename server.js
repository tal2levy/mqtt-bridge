const mosca = require('mosca');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const portHTTP = process.env.PORT || 10000;  // HTTP API
const mqttPort = 1883;                      // MQTT Broker

// הגדרות Broker MQTT
const mqttServer = new mosca.Server({ port: mqttPort });

// כאשר לקוח MQTT מתחבר
mqttServer.on('clientConnected', (client) => {
  console.log(`MQTT client connected: ${client.id}`);
});

// מאזין להודעות MQTT
mqttServer.on('published', (packet, client) => {
  console.log(`MQTT message on topic ${packet.topic}: ${packet.payload.toString()}`);
});

// API HTTP לשליחת הודעות MQTT
app.use(bodyParser.json());

app.post('/publish', (req, res) => {
  const { topic, message } = req.body;
  const packet = {
    topic,
    payload: message,
    qos: 0,
    retain: false,
  };
  mqttServer.publish(packet, () => {
    console.log(`Published via API: ${topic} -> ${message}`);
  });
  res.send('Published');
});

// הפעלת ה־HTTP API
app.listen(portHTTP, () => {
  console.log(`HTTP API running on port ${portHTTP}`);
  console.log(`MQTT Broker running on port ${mqttPort}`);
});