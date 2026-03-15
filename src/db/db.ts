// @ts-ignore
import sqlite3 from 'sqlite3';

const dbName = `data/late.sqlite`;
const db = new sqlite3.Database(dbName);

// TODO надо чтоб база инициализировалась Bot Instance
db.serialize(() => {
  // включаем foreign keys
  db.run(`PRAGMA foreign_keys = ON`);

  // таблица пользователей
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE,
      tgId INTEGER UNIQUE DEFAULT NUll
    )
  `);

  // таблица чатов
  db.run(`
    CREATE TABLE IF NOT EXISTS chatConfig (
      id INTEGER PRIMARY KEY,
      chatId INTEGER UNIQUE,
      chatTitle TEXT,
      gitBaseUrl TEXT,
      tokenGitLab TEXT 
    ) 
  `);

  // таблица связей пользователя с чатом
  db.run(`
    CREATE TABLE IF NOT EXISTS chatMembers (
      id INTEGER PRIMARY KEY,
      userInternalId INTEGER,
      chatInternalId INTEGER,
      isActive INTEGER DEFAULT 0 CHECK (isActive IN (0,1)),
      preset TEXT DEFAULT '[]',
      completedTasks TEXT DEFAULT '[]',
      verificationTasks TEXT DEFAULT '[]',
      idGitLab INTEGER,
      isAdmin INTEGER DEFAULT 0 CHECK (isAdmin IN (0,1)),


      FOREIGN KEY (userInternalId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chatInternalId) REFERENCES chatConfig(id),
      UNIQUE(userInternalId, chatInternalId)
    )
  `);
});

db.run(`
  INSERT OR IGNORE INTO chatConfig (chatId, chatTitle, gitBaseUrl, tokenGitLab)
  VALUES (-1, 'system_private_chat', NULL, NULL)
`);

export default db;
