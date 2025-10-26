import db from './db';

export interface ITasksUsers {
  id: number;
  name: string;
  completedTasks: string;
}

export class ITasksUsers {
  static all(): Promise<ITasksUsers[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM tasksUsers', (err, rows: ITasksUsers[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static findUsersByName(value: string[]): Promise<ITasksUsers[]> {
    return new Promise((resolve, reject) => {
      if (value.length === 0) {
        return reject(new Error('Вы не отправили теги'));
      }

      const placeholders = value.map(() => '?').join(', ');

      const sql = `SELECT * FROM tasksUsers WHERE name IN (${placeholders})`;

      db.all(sql, value, (err, rows: ITasksUsers[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static findUserById(id: number): Promise<ITasksUsers> {
    return new Promise((resolve, reject) => {
      if (!id) {
        return reject(new Error('ID не передан'));
      }

      const sql = `SELECT * FROM tasksUsers WHERE id = ?`;

      db.get(sql, id, (err, row: ITasksUsers) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static updateCompletedTasks(
    id: number,
    completedTasks: string,
    cb: (err: Error | null, res?: { updated: number }) => void
  ): void {
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

  static deleteAllCompletedTasks(
    cb: (err: Error | null, res?: { updated: number }) => void
  ): void {
    const sql = ` 
	 UPDATE tasksUsers
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
      const sql = `SELECT completedTasks FROM tasksUsers`;

      db.all(sql, (err, rows: { completedTasks: string }[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
}
