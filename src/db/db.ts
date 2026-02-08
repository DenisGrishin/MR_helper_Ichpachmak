import sqlite3 from 'sqlite3';

const dbName = `${process.env.NAME_PATH}`;
const db = new sqlite3.Database(dbName);

// TODO надо чтоб база инициализировалась Bot Instance
db.serialize(() => {
  const sql = ` 
CREATE TABLE IF NOT EXISTS users
	(
  id integer primary key,
  name TEXT,
  isActive INTEGER DEFAULT 0 CHECK (isActive IN (0, 1)),
  idGitLab INTEGER,
  preset TEXT DEFAULT '[]',
  completedTasks TEXT DEFAULT '[]',
  chatIds TEXT DEFAULT '[]'
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

db.serialize(() => {
  const sql = ` 
CREATE TABLE IF NOT EXISTS chatConfig
	(
  id integer primary key,
  chatId TEXT UNIQUE,
  chatTitle TEXT,
  tokenGitLab TEXT UNIQUE
  )`;

  db.run(sql);
});

// TODO потом удлаить
db.run(`ALTER TABLE users ADD COLUMN chatIds TEXT DEFAULT '[]'`, (err) => {
  if (err) {
    console.error('Ошибка при добавлении поля:', err.message);
  } else {
    console.log('Поле chatIds успешно добавлено');
  }
});

export default db;
