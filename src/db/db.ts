import sqlite3 from 'sqlite3';

const dbName = 'late.sqlite';
const db = new sqlite3.Database(dbName);

db.serialize(() => {
  const sql = ` 
CREATE TABLE IF NOT EXISTS users
	(
  id integer primary key,
  name TEXT,
  isActive INTEGER DEFAULT 0 CHECK (isActive IN (0, 1)),
  idGitLab INTEGER,
  preset TEXT DEFAULT '[]'
  )`;

  db.run(sql);
});

db.serialize(() => {
  const sql = ` 
CREATE TABLE IF NOT EXISTS tasksUsers
	(
  id integer primary key,
  name TEXT,
  completedTasks TEXT DEFAULT '[]'
  )`;

  db.run(sql);
});

// db.serialize(() => {
//   db.run(`ALTER TABLE users ADD COLUMN completedTasks TEXT DEFAULT '[]'`);
// });

export default db;
