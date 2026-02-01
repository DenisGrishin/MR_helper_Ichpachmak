import db from './db';

export interface IUser {
  id: number;
  name: string;
  isActive: number;
  idGitLab: number | null;
  preset: string;
  completedTasks: string;
  chatIds: string;
}

export interface ITasksUsers {
  id: number;
  name: string;
  completedTasks: string;
}

// таблицы в БД
export type NameTableBD = 'users' | 'tasksUsers';

export class Users {
  static all(nameTable: NameTableBD): Promise<IUser[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${nameTable}`, (err, rows: IUser[]) => {
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

  static findUsersByName(value: string[]): Promise<IUser[]> {
    return new Promise((resolve, reject) => {
      if (value.length === 0) {
        return reject(new Error('Вы не отправили теги'));
      }

      const placeholders = value.map(() => '?').join(', ');

      const sql = `SELECT * FROM users WHERE name IN (${placeholders})`;

      db.all(sql, value, (err, rows: IUser[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static findUserById(id: number, nameTable: NameTableBD): Promise<IUser> {
    return new Promise((resolve, reject) => {
      if (!id) {
        return reject(new Error('ID не передан'));
      }

      const sql = `SELECT * FROM ${nameTable} WHERE id = ?`;

      db.get(sql, id, (err, row: IUser) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static findByIdGitLabs(idGitLabs: number[]): Promise<IUser[]> {
    return new Promise((resolve, reject) => {
      const placeholders = idGitLabs.map(() => '?').join(',');

      const sql = `SELECT * FROM users WHERE idGitLab IN (${placeholders})`;

      db.all(sql, idGitLabs, (err, rows: IUser[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static create(
    users: string[],
    chatId: string,
    nameTable: NameTableBD,
    cb: (err: Error | null, res?: unknown) => void,
  ): void {
    if (users.length === 0) {
      return cb(new Error('Вы не отправили теги'));
    }

    const placeholders = users.map(() => '(?, ?)').join(', ');

    const sql = `INSERT INTO ${nameTable} (name, chatIds) VALUES ${placeholders}`;

    const values: string[] = [];
    for (const user of users) {
      values.push(user, JSON.stringify([chatId]));
    }

    db.run(sql, values, cb);
  }

  // todo обновить чтоб работала только по id
  static update(
    id: number,
    isActive: number | null,
    cb: (err: Error | null, res?: { updated: number }) => void,
  ): void {
    if (!id) return cb(new Error('Please provide an id'));

    const sql = `
	 UPDATE users
	 SET isActive = ?
	 WHERE id = ?
	 `;

    const values = [isActive, id];

    db.run(sql, values, function (err) {
      if (err) return cb(err);
      cb(null, { updated: this.changes });
    });
  }

  // TODO написать функцию которая будет обновлять по заданым параметрам
  static updateChatIdsForUsers(
    users: { id: number; chatIds: string }[],
    cb: (err: Error | null, res?: { updated: number }) => void,
  ): void {
    const sql = `
    UPDATE users
    SET chatIds = ?
    WHERE id = ?
  `;

    let updated = 0;

    db.serialize(() => {
      for (const user of users) {
        db.run(sql, [user.chatIds, user.id], function (err) {
          if (err) return cb(err);
          updated += this.changes;
        });
      }
    });

    db.wait(() => {
      cb(null, { updated });
    });
  }

  static updateGitLabId(
    id: number,
    newIdGitLab: number,
    cb: (err: Error | null, res?: { updated: number }) => void,
  ): void {
    const sql = `
	 UPDATE users
	 SET idGitLab = ?
	 WHERE id = ?
  `;

    db.run(sql, [newIdGitLab, id], function (err) {
      if (err) return cb(err);
      cb(null, { updated: this.changes });
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

  static updateCompletedTasks(
    id: number,
    completedTasks: string,
    nameTable: NameTableBD,
    cb: (err: Error | null, res?: { updated: number }) => void,
  ): void {
    const sql = `
	 UPDATE ${nameTable}
	 SET completedTasks = ?
	 WHERE id = ?
  `;

    db.run(sql, [completedTasks, id], function (err) {
      if (err) return cb(err);
      cb(null, { updated: this.changes });
    });
  }

  static deleteAllCompletedTasks(
    cb: (err: Error | null, res?: { updated: number }) => void,
  ): void {
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
    return new Promise<{ completedTasks: string }[]>((resolve, reject) => {
      const sql = `SELECT completedTasks FROM users`;

      db.all(sql, (err, rows: { completedTasks: string }[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static delete(id: number, nameTable: NameTableBD): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!id) return reject(new Error('Please provide an id'));
      db.run(`DELETE FROM ${nameTable} WHERE id = ?`, id, (err) => {
        if (err) return reject(err);
        resolve();
      });
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
