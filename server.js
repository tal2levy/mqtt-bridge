const express = require('express');
const bodyParser = require('body-parser');
const aedes = require('aedes')();
const net = require('net');

const app = express();
const portHTTP = process.env.PORT || 10000;  // HTTP API
const mqttPort = 1883;                      // MQTT Broker

// הפעלת Broker MQTT (TCP)
const mqttServer = net.createServer(aedes.handle);
mqttServer.listen(mqttPort, () => {
  console.log(`MQTT Broker running on port ${mqttPort}`);
});

// הדפסות על התחברות ל־Broker
aedes.on('client', (client) => {
  console.log(`MQTT client connected: ${client ? client.id : 'unknown'}`);
});

// קבלת הודעות MQTT
aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`MQTT message on topic ${packet.topic}: ${packet.payload.toString()}`);
  }
});

// HTTP API – שליחת הודעות MQTT דרך API
app.use(bodyParser.json());

app.post('/publish', (req, res) => {
  const { topic, message } = req.body;
  aedes.publish({ topic, payload: message }, () => {
    console.log(`Published via API: ${topic} -> ${message}`);
  });
  res.send('Published');
});

// הפעלת ה־HTTP API
app.listen(portHTTP, () => {
  console.log(`HTTP API running on port ${portHTTP}`);
});