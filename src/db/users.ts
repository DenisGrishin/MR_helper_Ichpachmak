import db from './db';

export interface IUser {
  id: number;
  name: string;
  tgId: number | null;
}

export interface ITasksUsers {
  id: number;
  name: string;
  completedTasks: string;
}

export class Users {
  /**
   * Получает список всех пользователей из таблицы users
   * @returns Promise<IUser[]> - массив пользователей
   */
  static all(): Promise<IUser[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM users`, (err, rows: IUser[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Находит одного пользователя по указанному полю
   * @param value - значение для поиска (id или name)
   * @param findField - поле, по которому выполняется поиск (по умолчанию id)
   * @param cb - callback (необязательный, можно удалить если не используется)
   * @returns Promise<IUser | null>
   *
   * Возвращает:
   * - пользователя, если найден
   * - null, если пользователь не найден
   */
  static findUser(
    value: string | number,
    findField: 'name' | 'id' = 'id',
    cb: (err: Error | null, users?: IUser[]) => void,
  ): Promise<any | null> {
    return new Promise((resolve, reject) => {
      if (value === null || value === undefined) {
        return reject(new Error('Вы не передали значение для поиска'));
      }

      const sql = `SELECT * FROM users WHERE ${findField} = ?`;

      db.get(sql, [value], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  /**
   * Создаёт пользователей и добавляет их в чат
   * @param users - массив имён пользователей
   * @param chatInternalId - id чата
   * @param cb - callback после завершения операции
   *
   * Логика:
   * 1. Создаёт пользователей в таблице users (если их ещё нет)
   * 2. Добавляет связь пользователя с чатом в таблицу chatMembers
   * 3. Выполняется внутри транзакции
   */
  static create(users: string[], chatInternalId: number, cb: any) {
    if (!users.length) return cb(new Error('Нет пользователей'));

    db.serialize(() => {
      db.run('BEGIN');

      for (const name of users) {
        db.run(`INSERT OR IGNORE INTO users (name) VALUES (?)`, [name]);

        db.run(
          `
        INSERT OR IGNORE INTO chatMembers (userInternalId, chatInternalId)
        SELECT id, ?
        FROM users
        WHERE name = ?
      `,
          [chatInternalId, name],
        );
      }

      db.run('COMMIT', cb);
    });
  }

  static updatePreset(
    id: number,
    preset: string,
    cb: (err: Error | null, res?: { updated: number }) => void,
  ): void {
    const sql = `
	 UPDATE users
	 SET preset = ?
	 WHERE id = ?
  `;

    db.run(sql, [preset, id], function (err) {
      if (err) return cb(err);
      cb(null, { updated: this.changes });
    });
  }
  /**
   * Удаляет пользователя из таблицы users
   * @param id - id пользователя
   * @returns Promise<void>
   *
   * Если пользователь связан с chatMembers,
   * записи могут удалиться автоматически
   * благодаря ON DELETE CASCADE.
   */
  static deleteUser(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error('Please provide an id'));
      db.run(`DELETE FROM users WHERE id = ?`, id, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}
