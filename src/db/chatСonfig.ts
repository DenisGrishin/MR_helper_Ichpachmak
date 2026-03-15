import db from './db';

export interface IChat {
  id: number;
  chatId: number;
  chatTitle: string;
  gitBaseUrl: string | null;
  tokenGitLab: string | null;
}

export class ChatСonfig {
  /**
   * Получает список всех чатов из таблицы chatConfig
   * @returns Promise<IChat[]> - массив чатов
   */
  static all(): Promise<IChat[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM chatConfig`, (err, rows: IChat[]) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  /**
   * Создаёт новый чат в таблице chatConfig
   * @param idChat - Telegram ID чата (chatId)
   * @param chatTitle - название чата
   * @param cb - callback после выполнения запроса
   *
   * Добавляет новую запись в таблицу chatConfig.
   */
  static create(
    idChat: string,
    chatTitle: string,
    cb: (err: Error | null, res?: unknown) => void,
  ): void {
    const sql = `INSERT INTO chatConfig  (chatId,chatTitle)
     VALUES (?,?)`;

    db.run(sql, [idChat, chatTitle], cb);
  }

  /**
   * Удаляет чат из таблицы chatConfig по Telegram ID
   * @param idChat - Telegram ID чата (chatId)
   * @returns Promise<void>
   *
   * Удаляет запись о чате из базы данных.
   */
  static delete(idChat: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!idChat) return reject(new Error('Please provide an id'));
      db.run(`DELETE FROM chatConfig  WHERE chatId = ?`, idChat, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  /**
   * Находит чат по внутреннему ID (id)
   * @param id - внутренний ID чата (chatConfig.id)
   * @returns Promise<IChat>
   *
   * Возвращает данные чата по его внутреннему идентификатору.
   */
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

  /**
   * Находит чат по Telegram ID (chatId)
   * @param id - Telegram ID чата
   * @returns Promise<IChat>
   *
   * Используется, когда бот получает сообщение из чата
   * и нужно найти конфигурацию чата в базе.
   */
  static findByTelegramId(id: number): Promise<IChat> {
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

  /**
   * Обновляет одно поле у чата по Telegram ID
   * @param chatId - Telegram ID чата
   * @param field - поле, которое нужно обновить
   * @param value - новое значение поля
   * @returns Promise<void>
   *
   * Позволяет обновлять только разрешённые поля:
   * - chatId
   * - chatTitle
   * - gitBaseUrl
   * - tokenGitLab
   */
  static updateFieldByChatId(
    chatId: number,
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
