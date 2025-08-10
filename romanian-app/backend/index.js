const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');
const srs = require('./srs');
const chatTeacher = require('./chatTeacher');
const dayjs = require('dayjs');

const app = express();
app.use(bodyParser.json());

// health check
app.get('/api/health', (req, res) => {
  res.json({status: 'ok'});
});

// get vocabulary review queue
app.get('/api/srs', async (req, res) => {
  const queue = await srs.getReviewQueue();
  res.json(queue);
});

// submit SRS answer
app.post('/api/srs', async (req, res) => {
  const {itemId, grade} = req.body;
  await srs.recordAnswer(itemId, grade);
  res.json({ok: true});
});

// chat with tutor
app.post('/api/chat', async (req, res) => {
  const {message, lang} = req.body;
  const reply = await chatTeacher.respond(message, lang);
  res.json(reply);
});

// what's new
app.get('/api/whatsnew', async (req, res) => {
  const files = await db.getRecentFiles();
  res.json({updatedTo: dayjs().format('DD.MM.YYYY'), files});
});

// exam simulator
app.get('/api/exam', async (req, res) => {
  const items = await db.getExamItems();
  res.json(items);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
