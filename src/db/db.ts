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
      tokenGitLab TEXT UNIQUE
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

      FOREIGN KEY (userInternalId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (chatInternalId) REFERENCES chatConfig(id) ON DELETE RESTRICT,
      UNIQUE(userInternalId, chatInternalId)
    )
  `);
});

export default db;

// test 1
// glpat-OfUHDUy-aRE9WSQClzbk6m86MQp1OjhmamsyCw.01.120n0o66h
// test 2
// glpat-hxZ7jHXUyo2zjuN_sYiHi286MQp1OmhtdnlmCw.01.120y7cj8y

// BOT_API_KEY=7758173769:AAEfm-lm4uOLAeOnYDQCbIyn0FtFrTdv7VM
// BASE_URL=gitlab.com
