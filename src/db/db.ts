import sqlite3 from 'sqlite3';

const dbName = `data/late.sqlite`;
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
  completedTasks TEXT DEFAULT '[]'
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

db.serialize(() => {
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='old_users'",
    (err, tables: any[]) => {
      if (err) {
        console.error(
          'Ошибка при проверке наличия таблицы old_users:',
          err.message,
        );
        return;
      }

      if (!tables || tables.length === 0) {
        const createOldUsersSQL = `
          CREATE TABLE IF NOT EXISTS old_users
          AS SELECT * FROM users WHERE 1=0;
        `;

        db.run(createOldUsersSQL, (err) => {
          if (err) {
            console.error('Ошибка при создании old_users:', err.message);
            return;
          }

          console.log('Таблица old_users создана');

          // копируем данные в резервную таблицу
          db.run('INSERT INTO old_users SELECT * FROM users', (err) => {
            if (err) {
              console.error('Ошибка при копировании данных:', err.message);
              return;
            }

            console.log('Данные скопированы в old_users');

            db.run(
              `ALTER TABLE users ADD COLUMN chatIds TEXT DEFAULT '[]'`,
              (err) => {
                if (err) {
                  if (!err.message.includes('duplicate column name')) {
                    console.error(
                      'Ошибка при добавлении chatIds в users:',
                      err.message,
                    );
                  }
                } else {
                  console.log('Поле chatIds добавлено в users');
                }
              },
            );
          });
        });
      }
    },
  );
});
export default db;
