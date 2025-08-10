CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT,
  mimeType TEXT,
  modifiedTime TEXT
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  title TEXT,
  level TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  unitId TEXT,
  title TEXT
);

CREATE TABLE IF NOT EXISTS grammar_points (
  id TEXT PRIMARY KEY,
  lessonId TEXT,
  title TEXT,
  content TEXT
);

CREATE TABLE IF NOT EXISTS vocab (
  id TEXT PRIMARY KEY,
  lessonId TEXT,
  ro TEXT,
  he TEXT,
  en TEXT,
  ru TEXT,
  audio TEXT
);

CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  lessonId TEXT,
  ro TEXT,
  he TEXT,
  en TEXT,
  ru TEXT,
  audio TEXT
);

CREATE TABLE IF NOT EXISTS srs_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT,
  answer TEXT,
  nextReview DATETIME DEFAULT (datetime('now')),
  lastGrade INTEGER DEFAULT 0,
  reviews INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt TEXT,
  answer TEXT,
  sourceFile TEXT
);
