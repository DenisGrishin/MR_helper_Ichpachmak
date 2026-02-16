import db from './db';

export interface IUser {
  id: number;
  name: string;
  tgId: number | null;
}

export interface IChatMembers {
  id: number;
  userId: number;
  chatId: number;
  isActive: boolean;
  preset: string;
  completedTasks: string;
  idGitLab: string;
}

export interface ITasksUsers {
  id: number;
  name: string;
  completedTasks: string;
}

// таблицы в БД
export type NameTableBD = 'users' | 'tasksUsers';

export class Users {
  static all(): Promise<IUser[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM users`, (err, rows: IUser[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static findUsers(
    list: string[],
    keySearch: 'id' | 'name',
    cb: (err: Error | null, users?: IUser[]) => void,
  ): void {
    if (list.length === 0) {
      return cb(new Error('Вы не отправили теги'));
    }
    // TODO вот тут разделить id или  name
    const placeholders = list.map(() => '?').join(', ');

    const sql = `SELECT * FROM users WHERE ${keySearch} IN (${placeholders})`;

    db.all(sql, list, cb);
  }

  static findUser(
    id: number,
    cb: (err: Error | null, users?: IUser[]) => void,
  ): Promise<IUser | null> {
    return new Promise((resolve, reject) => {
      if (!id && id !== 0) {
        return reject(new Error('Вы не отправили id'));
      }

      const sql = `SELECT * FROM users WHERE id = ?`;

      db.get(sql, [id], (err, row) => {
        // db.get возвращает один объект, а не массив
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  // new
  static findByUser(name: string): Promise<IChat> {
    return new Promise((resolve, reject) => {
      if (!name) {
        return reject(new Error('Name не передан'));
      }

      const sql = `SELECT * FROM users WHERE name = ?`;

      db.get(sql, name, (err, row: IChat) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  // new
  static findUsersByName(
    names: string[],
    chatInternalId: number,
  ): Promise<IUser[]> {
    return new Promise((resolve, reject) => {
      if (!names.length) {
        return reject(new Error('Вы не отправили пользователей'));
      }

      const placeholders = names.map(() => '?').join(', ');

      const sql = `
    SELECT u.name
    FROM chatMembers cm
    JOIN users u ON u.id = cm.userInternalId
    WHERE u.name IN (${placeholders})
    AND cm.chatInternalId = ?
  `;

      db.all(sql, [...names, chatInternalId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  // new
  static findUsersByChatId(
    chatInternalId: number,
    userFields: (keyof IUser)[] = ['id', 'name'], // поля из users
    memberFields: (keyof any)[] = ['isActive', 'preset', 'completedTasks'], // поля из chatMembers
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Формируем SELECT
      const userSelect = userFields.map((f) => `u.${f}`).join(', ');
      const memberSelect = memberFields.map((f) => `cm.${f}`).join(', ');
      const selectClause = [userSelect, memberSelect]
        .filter(Boolean)
        .join(', ');

      const sql = `
      SELECT ${selectClause}
      FROM chatMembers cm
      JOIN users u ON u.id = cm.userInternalId
      WHERE cm.chatInternalId = ?
    `;

      db.all(sql, [chatInternalId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  // new
  static findChatMember(userId: number, chatInternalId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
      SELECT *
      FROM chatMembers
      WHERE userInternalId = ? AND chatInternalId = ?
    `;

      db.get(sql, [userId, chatInternalId], (err, row) => {
        if (err) return reject(err);
        resolve(row || null); // null, если запись не найдена
      });
    });
  }

  // new
  static addUserToChat(userId: number, chatInternalId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
      INSERT OR IGNORE INTO chatMembers (userInternalId, chatInternalId)
      VALUES (?, ?)
    `;

      db.run(sql, [userId, chatInternalId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  // new
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

  // new
  static updateChatMember(
    userId: number,
    chatId: number,
    fieldsToUpdate: Record<string, any>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(fieldsToUpdate);
      if (!keys.length) return reject(new Error('Нет полей для обновления'));

      const setClause = keys.map((key) => `${key} = ?`).join(', ');
      const values = keys.map((key) => fieldsToUpdate[key]);

      const sql = `
      UPDATE chatMembers
      SET ${setClause}
      WHERE userInternalId = ? AND chatInternalId = ?
      `;

      db.run(sql, [...values, userId, chatId], function (err) {
        if (err) return reject(err);
        resolve();
      });
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

  static deleteAllCompletedTasks(
    cb: (err: Error | null, res?: { updated: number }) => void,
  ): void {
    return;
    const sql = ` 
	 UPDATE users
	 SET completedTasks = '[]'
  `;

    // TODO узгать чем отличаеться run от all, get
    db.run(sql, [], function (err) {
      if (err) return cb(err);
      cb(null, { updated: this.changes });
    });
  }

  static getCompletedTasks() {
    return;
    return new Promise<{ completedTasks: string }[]>((resolve, reject) => {
      const sql = `SELECT completedTasks FROM users`;

      db.all(sql, (err, rows: { completedTasks: string }[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static deleteUser(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error('Please provide an id'));
      db.run(`DELETE FROM users WHERE id = ?`, id, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  static deleteChatMember(
    userInternalId: number,
    chatInternalId: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!userInternalId || !chatInternalId) {
        return reject(new Error('Please provide userId and chatId'));
      }

      db.run(
        `DELETE FROM chatMembers WHERE userInternalId = ? AND chatInternalId = ?`,
        [userInternalId, chatInternalId],
        (err) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });
  }

  // TODO переписать эту хуйню
  static updateMultipleTasksUsers(
    completedTasks: string,
    id: number,
    cb: (err: Error | null, res?: { updated: number }) => void,
  ) {
    const sql = `
	 UPDATE tasksUsers
	 SET completedTasks = ?
	 WHERE id = ?
  `;

    db.run(sql, [completedTasks, id], function (err) {
      if (err) return cb(err);
      cb(null, { updated: this.changes });
    });
  }
}
