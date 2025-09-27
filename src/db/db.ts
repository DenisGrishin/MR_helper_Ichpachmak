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

export interface IUser {
  id: number;
  name: string;
  isActive: number;
  idGitLab: number | null;
  preset: string;
}

export class User {
  static all(cb: (err: Error | null, users?: IUser[]) => void): void {
    db.all('SELECT * FROM users', cb);
  }

  static findUsers(
    list: string[],
    keySearch: 'id' | 'name',
    cb: (err: Error | null, users?: IUser[]) => void
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

  static findUserById(id: number): Promise<IUser> {
    return new Promise((resolve, reject) => {
      if (!id) {
        return reject(new Error('ID не передан'));
      }

      const sql = `SELECT * FROM users WHERE id = ?`;

      db.get(sql, id, (err, row: IUser) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static findByIdGitLabs(
    idGitLabs: number[],
    cb: (err: Error | null, users?: IUser[]) => void
  ): void {
    const placeholders = idGitLabs.map(() => '?').join(',');
    const sql = `SELECT * FROM users WHERE idGitLab IN (${placeholders})`;

    db.all(sql, idGitLabs, cb);
  }

  static create(
    users: string[],
    cb: (err: Error | null, res?: unknown) => void
  ): void {
    if (users.length === 0) {
      return cb(new Error('Вы не отправили теги'));
    }

    const placeholders = users.map(() => '(?)').join(', ');

    const sql = `INSERT INTO users (name) VALUES ${placeholders}`;

    db.run(sql, users, cb);
  }
  // todo обновить чтоб работала только по id
  static update(
    id: number,
    isActive: number | null,
    cb: (err: Error | null, res?: { updated: number }) => void
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

  static updateGitLabId(
    id: number,
    newIdGitLab: number,
    cb: (err: Error | null, res?: { updated: number }) => void
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
    cb: (err: Error | null, res?: { updated: number }) => void
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

  static delete(
    id: number,
    cb: (err: Error | null, res?: unknown) => void
  ): void {
    if (!id) return cb(new Error('Please provide an id'));
    db.run('DELETE FROM users WHERE id = ?', id, cb);
  }
}

export default db;
