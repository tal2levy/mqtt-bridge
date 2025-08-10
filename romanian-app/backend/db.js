const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'romanian.db');
const db = new sqlite3.Database(dbPath);

// initialize schema
const fs = require('fs');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

module.exports = {
  db,
  getRecentFiles(limit=10){
    return new Promise((resolve,reject)=>{
      db.all("SELECT * FROM files ORDER BY datetime(modifiedTime) DESC LIMIT ?", [limit], (err,rows)=>{
        if(err) reject(err); else resolve(rows);
      });
    });
  },
  getReviewItems(cb){
    db.all('SELECT * FROM srs_items WHERE nextReview <= datetime("now") LIMIT 20', cb);
  },
  recordReview(id, grade, cb){
    db.run('UPDATE srs_items SET lastGrade=?, reviews=reviews+1 WHERE id=?', [grade, id], cb);
  },
  upsertFileMeta(file){
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO files(id, name, mimeType, modifiedTime) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, mimeType=excluded.mimeType, modifiedTime=excluded.modifiedTime', [file.id, file.name, file.mimeType, file.modifiedTime], function(err){
        if(err) reject(err); else resolve();
      });
    });
  },
  getExamItems(){
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM exams ORDER BY RANDOM() LIMIT 20', (err, rows)=>{
        if(err) reject(err); else resolve(rows);
      });
    });
  }
};
