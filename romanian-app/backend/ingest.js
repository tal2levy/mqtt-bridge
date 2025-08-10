const {google} = require('googleapis');
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
    const auth = await authorize();
    const files = await listFiles(auth);
    for (const file of files) {
      // map file to unit/lesson/etc.
      await db.upsertFileMeta(file);
    }

    // mock SRS items
    const mock = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock_data/unit1.json'), 'utf-8'));
    for (const v of mock.vocab) {
      db.db.run('INSERT INTO srs_items(question, answer) VALUES(?,?)', [v.ro, v.he]);
    }

    console.log(`Ingested ${files.length} files and ${mock.vocab.length} vocab items.`);
  } catch (err) {
    console.error('Ingest failed', err);
  }
}

if (require.main === module) {
  ingest();
}

module.exports = ingest;
