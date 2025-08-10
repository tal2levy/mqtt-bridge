const db = require('./db');

function getReviewQueue(){
  return new Promise((resolve, reject) => {
    db.getReviewItems((err, rows)=>{
      if(err) reject(err); else resolve(rows);
    });
  });
}

function recordAnswer(id, grade){
  return new Promise((resolve, reject)=>{
    db.recordReview(id, grade, err=>{
      if(err) reject(err); else resolve();
    });
  });
}

module.exports = {getReviewQueue, recordAnswer};
