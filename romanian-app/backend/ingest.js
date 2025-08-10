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

async function ingest() {
  try {
    let files = [];
    try {
      if (!google) throw new Error('googleapis not installed');
      const auth = await authorize();
      files = await listFiles(auth);
      for (const file of files) {
        // map file to unit/lesson/etc.
        await db.upsertFileMeta(file);
      }
    } catch (driveErr) {
      console.warn('Google Drive credentials missing or invalid; ingesting mock data only (demo mode).');
    }

    // mock SRS items
    const mock = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock_data/unit1.json'), 'utf-8'));
    for (const v of mock.vocab) {
      const exists = await new Promise((resolve, reject) => {
        db.db.get('SELECT 1 FROM srs_items WHERE question = ? AND answer = ?', [v.ro, v.he], (err, row) => {
          if (err) reject(err); else resolve(row);
        });
      });
      if (!exists) {
        await new Promise((resolve, reject) => {
          db.db.run('INSERT INTO srs_items(question, answer) VALUES(?,?)', [v.ro, v.he], err => {
            if (err) reject(err); else resolve();
          });
        });
      }
    }

    const demoMsg = files.length === 0 ? ' (demo mode)' : '';
    console.log(`Ingested ${files.length} files and ${mock.vocab.length} vocab items${demoMsg}.`);
  } catch (err) {
    console.error('Ingest failed', err);
  }
}

if (require.main === module) {
  ingest();
}

module.exports = ingest;
