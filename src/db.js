const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./devconnect.db');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    github_username TEXT,
    github_token TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS repos (
    id TEXT PRIMARY KEY,
    github_repo_id INTEGER,
    name TEXT,
    url TEXT,
    visibility TEXT,
    owner_id TEXT
  )`);
});

module.exports = db;
