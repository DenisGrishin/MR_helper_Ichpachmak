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
      db.all(`SELECT * FROM chatConfig`, (err, rows: IChat[]) => {
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
    const sql = `INSERT INTO chatConfig  (chatId,chatTitle)
     VALUES (?,?)`;

    db.run(sql, [idChat, chatTitle], cb);
  }

  static delete(idChat: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!idChat) return reject(new Error('Please provide an id'));
      db.run(`DELETE FROM chatConfig  WHERE chatId = ?`, idChat, (err) => {
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

      const sql = `SELECT * FROM chatConfig WHERE id = ?`;

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

      const sql = `SELECT * FROM chatConfig WHERE chatId = ?`;

      db.get(sql, id, (err, row: IChat) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static updateFieldByChatId(
    chatId: string,
    field: keyof IChat,
    value: any,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!chatId || !field) {
        return reject(new Error('chatId или поле не переданы'));
      }

      const allowedFields: (keyof IChat)[] = [
        'chatId',
        'chatTitle',
        'gitBaseUrl',
        'tokenGitLab',
      ];

      if (!allowedFields.includes(field)) {
        return reject(new Error('Недопустимое поле'));
      }

      const sql = `UPDATE chatConfig SET ${field} = ? WHERE chatId = ?`;

      db.run(sql, [value, chatId], function (err) {
        if (err) return reject(err);

        if (this.changes === 0) {
          return reject(new Error('Запись не найдена'));
        }

        resolve();
      });
    });
  }
}
