import db from '../db';

export interface IChat {
  id: number;
  chatId: string;
  chatTitle: string;
  gitBaseUrl: string | null;
  tokenGitLab: string | null;
}

export class ChatСonfig {
  static all(): Promise<IChat[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM chatСonfig`, (err, rows: IChat[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static create(
    idChat: string,
    chatTitle: string,
    cb: (err: Error | null, res?: unknown) => void,
  ): void {
    const sql = `INSERT INTO chatСonfig (chatId,chatTitle)
     VALUES (?,?)`;

    db.run(sql, [idChat, chatTitle], cb);
  }

  static delete(idChat: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!idChat) return reject(new Error('Please provide an id'));
      db.run(`DELETE FROM chatСonfig WHERE id = ?`, idChat, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  static findById(id: number): Promise<IChat> {
    return new Promise((resolve, reject) => {
      if (!id) {
        return reject(new Error('ID не передан'));
      }

      const sql = `SELECT * FROM chatСonfig WHERE id = ?`;

      db.get(sql, id, (err, row: IChat) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static findByChatId(id: string): Promise<IChat> {
    return new Promise((resolve, reject) => {
      if (!id) {
        return reject(new Error('ID не передан'));
      }

      const sql = `SELECT * FROM chatСonfig WHERE chatId = ?`;

      db.get(sql, id, (err, row: IChat) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}
