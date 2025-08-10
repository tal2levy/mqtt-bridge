let google;
try {
  ({google} = require('googleapis'));
} catch (e) {
  // googleapis is optional for mock-only ingest
  google = null;
}
const db = require('./db');
const fs = require('fs');
const path = require('path');

const FOLDER_ID = process.env.DRIVE_FOLDER_ID || '1K5iqMAgXlW2F_0kz_GYVVDEY28ltuA15';

async function authorize() {
  const jwt = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    ['https://www.googleapis.com/auth/drive.readonly']
  );
  await jwt.authorize();
  return jwt;
}

async function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime)'
  });
  return res.data.files;
}

async function downloadJson(auth, fileId) {
  const drive = google.drive({version: 'v3', auth});
  const res = await drive.files.get({fileId, alt: 'media'});
  return res.data;
}

async function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.db.run(sql, params, err => {
      if (err) reject(err); else resolve();
    });
  });
}

async function get(sql, params) {
  return new Promise((resolve, reject) => {
    db.db.get(sql, params, (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
}

async function processUnit(data, source = 'mock') {
  let counts = {vocab: 0, dialogues: 0, exercises: 0};
  if (data.vocab) {
    for (const v of data.vocab) {
      const id = `${source}:vocab:${v.ro}`;
      await run(
        'INSERT OR REPLACE INTO vocab(id, lessonId, ro, he, en, ru, audio) VALUES(?,?,?,?,?,?,?)',
        [id, null, v.ro, v.he, v.en, v.ru, v.audio || null]
      );
      const exists = await get('SELECT 1 FROM srs_items WHERE question = ? AND answer = ?', [v.ro, v.he]);
      if (!exists) {
        await run('INSERT INTO srs_items(question, answer) VALUES(?,?)', [v.ro, v.he]);
      }
      counts.vocab++;
    }
  }
  if (data.dialogues) {
    for (const d of data.dialogues) {
      const id = `${source}:dialogue:${d.ro}`;
      await run(
        'INSERT OR REPLACE INTO dialogues(id, lessonId, ro, he, en, ru, audio) VALUES(?,?,?,?,?,?,?)',
        [id, null, d.ro, d.he, d.en, d.ru, d.audio || null]
      );
      counts.dialogues++;
    }
  }
  if (data.exercises) {
    for (const ex of data.exercises) {
      await run('INSERT INTO exams(prompt, answer, sourceFile) VALUES(?,?,?)', [ex.prompt, ex.answer, source]);
      counts.exercises++;
    }
  }
  return counts;
}

async function ingest() {
  try {
    let files = [];
    let totals = {vocab: 0, dialogues: 0, exercises: 0};
    try {
      if (!google) throw new Error('googleapis not installed');
      const auth = await authorize();
      files = await listFiles(auth);
      for (const file of files) {
        // map file to unit/lesson/etc.
        await db.upsertFileMeta(file);
        if (file.mimeType === 'application/json') {
          try {
            const data = await downloadJson(auth, file.id);
            const c = await processUnit(data, file.id);
            totals.vocab += c.vocab;
            totals.dialogues += c.dialogues;
            totals.exercises += c.exercises;
          } catch (e) {
            console.warn(`Failed to process ${file.name}`, e);
          }
        }
      }
    } catch (driveErr) {
      console.warn('Google Drive credentials missing or invalid; ingesting mock data only (demo mode).');
    }

    const mock = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock_data/unit1.json'), 'utf-8'));
    const mockCounts = await processUnit(mock, 'mock');
    totals.vocab += mockCounts.vocab;
    totals.dialogues += mockCounts.dialogues;
    totals.exercises += mockCounts.exercises;

    const demoMsg = files.length === 0 ? ' (demo mode)' : '';
    console.log(
      `Ingested ${files.length} files, ${totals.vocab} vocab, ${totals.dialogues} dialogues, ${totals.exercises} exercises${demoMsg}.`
    );
  } catch (err) {
    console.error('Ingest failed', err);
  }
}

if (require.main === module) {
  ingest();
}

module.exports = ingest;
