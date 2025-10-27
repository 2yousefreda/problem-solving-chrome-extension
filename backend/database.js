const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const DBSOURCE = "db.sqlite"; 

const db = new sqlite3.Database(DBSOURCE, (err) => {
 if (err) {
 console.error(err.message);
 throw err;
 } else {
 console.log('Connected to the SQLite database.');
 db.serialize(() => {
 console.log('Initializing database schema...'); 

 db.run(`CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT UNIQUE NOT NULL
 )`, (err) => {
 if (err) console.error("Error creating users table:", err.message);
 else console.log("Table 'users' is ready.");
 }); 

 db.run(`CREATE TABLE IF NOT EXISTS problems (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT UNIQUE,
 difficulty TEXT,
 hint TEXT,
 url TEXT,
 "order" INTEGER
 )`, (err) => {
 if (!err) {
 console.log("Table 'problems' is ready. Loading data...");
 const problems = JSON.parse(fs.readFileSync('problems.json', 'utf8'));
 const insert = 'INSERT OR IGNORE INTO problems (title, difficulty, hint, url, "order") VALUES (?,?,?,?,?)';
 problems.forEach((p, i) => db.run(insert, [p.title, p.difficulty, p.hint, p.url, i + 1]));
 }
 }); 

 db.run(`CREATE TABLE IF NOT EXISTS user_progress (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 problem_id INTEGER NOT NULL,
 completed_at TEXT NOT NULL,
 FOREIGN KEY (user_id) REFERENCES users (id),
 UNIQUE (user_id, problem_id)
 )`, (err) => {
 if (err) console.error("Error creating user_progress table:", err.message);
 else console.log("Table 'user_progress' is ready.");
 });
 });
 }
}); 

module.exports = db;