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

  static find(
    name: string,
    cb: (err: Error | null, user?: IUser) => void
  ): void {
    db.get('SELECT * FROM users WHERE name = ?', [name], cb);
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
    data: { name: string; idGitLab: number },
    cb: (err: Error | null, res?: unknown) => void
  ): void {
    const sql = 'INSERT INTO users(name, idGitLab) VALUES (?, ?)';
    db.run(sql, [data.name, data.idGitLab], cb);
  }

  static update(
    id: number,
    data: { name: string; isActive?: number | null; idGitLab?: number | null },
    cb: (err: Error | null, res?: { updated: number }) => void
  ): void {
    if (!id) return cb(new Error('Please provide an id'));

    const sql = `
      UPDATE users
      SET name = ?, isActive = ?
      WHERE id = ? AND idGitLab = ?
    `;

    const values = [
      data.name,
      data.isActive ?? null,
      id,
      data.idGitLab ?? null,
    ];

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
