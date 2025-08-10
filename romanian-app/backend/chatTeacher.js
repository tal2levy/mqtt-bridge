const fs = require('fs');
const path = require('path');

// simple mock: pick random dialogue line from mock_data
const mockPath = path.join(__dirname, '../mock_data/unit1.json');
const data = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));

async function respond(message, lang='he'){
  // echo with random phrase from data
  const line = data.dialogues[Math.floor(Math.random()*data.dialogues.length)];
  return {reply: line.ro, translation: line[lang]};
}

module.exports = {respond};
