import db from './db';
import { IUser } from './users';

export interface IChatMember {
  id: number;
  userInternalId: number;
  chatInternalId: number;
  isActive: 0 | 1;
  preset: string;
  completedTasks: string;
  verificationTasks: string;
  idGitLab: number | null;
  isAdmin: 0 | 1;
}

const ALLOWED_FIELDS = [
  'isActive',
  'preset',
  'completedTasks',
  'verificationTasks',
  'idGitLab',
  'isAdmin',
] as const;

type ChatMemberField = (typeof ALLOWED_FIELDS)[number];

export class ChatMembers {
  /**
   * Обновляет поля пользователя в чате
   * @param userId - id пользователя (userInternalId)
   * @param chatId - id чата (chatInternalId)
   * @param fieldsToUpdate - объект с ключами IChatMembers и значениями
   */
  static updateField(
    userId: number,
    chatId: number,
    fieldsToUpdate: Partial<IChatMember>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Приводим Object.keys к ключам интерфейса
      const keys = Object.keys(fieldsToUpdate) as (keyof IChatMember)[];
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
  /**
   * Получает список пользователей в конкретном чате вместе с данными членства.
   * Можно выбрать, какие поля пользователей (`IUser`) и поля членства (`IChatMember`) возвращать.
   *
   * @param chatInternalId - ID чата (chatInternalId)
   * @param userFields - массив ключей из IUser, которые нужно выбрать (по умолчанию ['id', 'name'])
   * @param memberFields - массив ключей из IChatMember, которые нужно выбрать (по умолчанию ['isActive', 'preset', 'completedTasks'])
   * @returns Promise с массивом объектов, содержащих выбранные поля пользователей и членства
   *
   * Пример использования:
   * ```ts
   * const users = await ChatMembers.findUsersByChatId(5, ['id','name'], ['isActive','completedTasks']);
   * ```
   */
  static findChatMembersWithFields(
    chatInternalId: number,
    userFields: (keyof IUser)[] = ['id', 'name'],
    memberFields: (keyof IChatMember)[] = [
      'isActive',
      'preset',
      'completedTasks',
    ],
  ) {
    return new Promise((resolve, reject) => {
      const userSelect = userFields.map((f) => `u.${String(f)}`).join(', ');
      const memberSelect = memberFields
        .map((f) => `cm.${String(f)}`)
        .join(', ');
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

  /**
   * Получает одного участника чата
   * @param userId - id пользователя (userInternalId)
   * @param chatInternalId - id чата (chatInternalId)
   * @param memberFields - список полей из таблицы chatMembers, которые нужно вернуть
   * @returns объект участника чата или null, если пользователь не найден в чате
   */
  static findChatMember(
    userId: number,
    chatInternalId: number,
    memberFields: (keyof IChatMember)[] = [
      'isActive',
      'preset',
      'completedTasks',
    ],
  ): Promise<Partial<IChatMember> | null> {
    return new Promise((resolve, reject) => {
      const selectClause = memberFields.length
        ? memberFields.map((f) => String(f)).join(', ')
        : '*';

      const sql = `
      SELECT ${selectClause}
      FROM chatMembers
      WHERE userInternalId = ? AND chatInternalId = ?
      LIMIT 1
    `;

      db.get(sql, [userId, chatInternalId], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  /**
   * Очистка колонки у всех пользователей, либо только у чата
   * @param field - имя колонки
   * @param chatInternalId - опционально: id чата (chatInternalId)
   */
  static clearField(
    field: ChatMemberField,
    chatInternalId?: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!ALLOWED_FIELDS.includes(field)) {
        return reject(new Error(`Недопустимое поле: ${field}`));
      }

      const sql = chatInternalId
        ? `UPDATE chatMembers SET ${field} = ? WHERE chatInternalId = ?`
        : `UPDATE chatMembers SET ${field} = ?`;

      // Определяем значение по умолчанию для типа поля
      let defaultValue: any = null;
      if (field === 'isActive' || field === 'isAdmin') defaultValue = 0;
      if (
        field === 'preset' ||
        field === 'completedTasks' ||
        field === 'verificationTasks'
      )
        defaultValue = '[]';

      const params = chatInternalId
        ? [defaultValue, chatInternalId]
        : [defaultValue];

      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  /**
   * Удаляет пользователя из чата (запись из таблицы chatMembers)
   * @param userInternalId - внутренний id пользователя (users.id)
   * @param chatInternalId - внутренний id чата (chatConfig.id)
   * @returns Promise<void>
   *
   * Функция удаляет связь пользователя с чатом из таблицы chatMembers.
   * Если пользователь или чат не переданы — вернёт ошибку.
   */
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

  /**
   * Ищет пользователей по списку имён в конкретном чате
   * @param names - массив имён пользователей (users.name)
   * @param chatInternalId - внутренний id чата (chatConfig.id)
   * @returns Promise с массивом найденных пользователей
   *
   * Функция проверяет, какие из переданных пользователей уже состоят в чате.
   * Возвращает список пользователей, которые найдены в таблице chatMembers
   * для указанного чата.
   */
  static findUsersByName(
    names: string[],
    chatInternalId: number,
  ): Promise<{ name: string }[]> {
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
        resolve(rows as { name: string }[]);
      });
    });
  }

  /**
   * Ищет участников чата по массиву userInternalId и возвращает данные из таблицы chatMembers
   * @param userIds - массив внутренних ID пользователей (userInternalId из таблицы users)
   * @param chatInternalId - внутренний id чата (chatConfig.id)
   * @param memberFields - список полей из таблицы chatMembers, которые нужно вернуть (опционально)
   * @returns Promise с массивом объектов IChatMember
   *
   * Функция ищет пользователей по их внутренним ID в таблице chatMembers.
   *
   * Пример использования:
   * ```ts
   * const members = await ChatMembers.findChatMembersByIds([10, 15, 20], 5);
   * // Вернёт массив: [{ id: 1, userInternalId: 10, chatInternalId: 5, isAdmin: 1, ... }, ...]
   * ```
   */
  static findChatMembersByIds(
    userIds: number[],
    chatInternalId: number,
    memberFields: (keyof IChatMember)[] = [
      'id',
      'userInternalId',
      'chatInternalId',
      'isActive',
      'isAdmin',
    ],
  ): Promise<Partial<IChatMember>[]> {
    return new Promise((resolve, reject) => {
      if (!userIds || userIds.length === 0) {
        return reject(new Error('Массив ID пользователей пуст'));
      }

      const placeholders = userIds.map(() => '?').join(',');
      const selectClause = memberFields.length
        ? memberFields.map((f) => String(f)).join(', ')
        : '*';

      const sql = `
      SELECT ${selectClause}
      FROM chatMembers
      WHERE userInternalId IN (${placeholders})
      AND chatInternalId = ?
    `;

      db.all(sql, [...userIds, chatInternalId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows as Partial<IChatMember>[]);
      });
    });
  }

  /**
   * Массово обновляет одно поле для списка пользователей в чате
   * @param userIds - массив внутренних ID пользователей (userInternalId)
   * @param chatInternalId - внутренний id чата (chatConfig.id)
   * @param field - поле для обновления (например, 'isAdmin')
   * @param value - новое значение поля
   * @returns Promise<{ updated: number }> - количество обновлённых записей
   *
   * Пример использования:
   * ```typescript
   * const result = await ChatMembers.updateFieldByIds(
   *   [10, 15, 20],      // ID пользователей
   *   5,                   // ID чата
   *   'isAdmin',            // поле
   *   1                    // новое значение (1 = админ)
   * );
   * console.log(`Обновлено: ${result.updated} записей`);
   * ```
   */
  static updateFieldByIds(
    userIds: number[],
    chatInternalId: number,
    field: ChatMemberField,
    value: any,
  ): Promise<{ updated: number }> {
    return new Promise((resolve, reject) => {
      if (!userIds || userIds.length === 0) {
        return reject(new Error('Массив ID пользователей пуст'));
      }

      if (!ALLOWED_FIELDS.includes(field)) {
        return reject(new Error(`Недопустимое поле: ${field}`));
      }

      const placeholders = userIds.map(() => '?').join(',');
      const sql = `
      UPDATE chatMembers
      SET ${field} = ?
      WHERE userInternalId IN (${placeholders})
      AND chatInternalId = ?
    `;

      db.run(sql, [value, ...userIds, chatInternalId], function (err) {
        if (err) return reject(err);
        resolve({ updated: this.changes });
      });
    });
  }

  /**
   * Создает новых участников чата (массовое создание)
   * @param userInternalIds - массив внутренних ID пользователей (из таблицы users)
   * @param chatInternalId - внутренний ID чата (из таблицы chatConfig)
   * @param isAdmin - являются ли пользователи админами (по умолчанию 0)
   * @returns Promise<{ created: number }> - количество созданных записей
   */
  static async createChatMembers(
    userInternalIds: number[],
    chatInternalId: number,
    isAdmin: 0 | 1 = 0,
  ): Promise<{ created: number }> {
    return new Promise((resolve, reject) => {
      if (!userInternalIds || userInternalIds.length === 0) {
        return reject(new Error('Массив ID пользователей пуст'));
      }

      const placeholders = userInternalIds
        .map(() => "(?, ?, 0, '[]', '[]', '[]', ?)")
        .join(', ');
      const values = userInternalIds.flatMap((userId) => [
        userId,
        chatInternalId,
        isAdmin,
      ]);

      const sql = `
      INSERT INTO chatMembers (
        userInternalId,
        chatInternalId,
        isActive,
        preset,
        completedTasks,
        verificationTasks,
        isAdmin
      ) VALUES ${placeholders}
    `;

      db.run(sql, values, function (err) {
        if (err) return reject(err);
        resolve({ created: this.changes });
      });
    });
  }
}
