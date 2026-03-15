import db from '../db';
import path from 'path';
import fs from 'fs';
import logger from '../../config/logger';

/**
 * Миграция: Удаление ограничения UNIQUE с поля tokenGitLab в таблице chatConfig
 * Дата: 2026-03-15
 * Описание: SQLite не поддерживает ALTER TABLE для удаления ограничений напрямую,
 * поэтому нужно пересоздать таблицу без ограничения UNIQUE
 */

const MIGRATION_NAME = 'remove_token_unique_constraint';
const MIGRATION_FILE = path.join(__dirname, `${MIGRATION_NAME}.sql`);
const DB_PATH = path.join(__dirname, '../../../data/late.sqlite');
const BACKUP_PATH = path.join(__dirname, '../../../data/late.sqlite.backup');

/**
 * Создаёт резервную копию файла базы данных
 */
async function createBackup(): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(DB_PATH);
    const writeStream = fs.createWriteStream(BACKUP_PATH);

    readStream.pipe(writeStream);

    writeStream.on('finish', () => {
      logger.info(`✅ Резервная копия создана: ${BACKUP_PATH}`);
      resolve();
    });

    writeStream.on('error', (err) => {
      logger.error({ err }, 'Ошибка при создании бэкапа');
      reject(err);
    });

    readStream.on('error', (err) => {
      logger.error({ err }, 'Ошибка при чтении базы данных');
      reject(err);
    });
  });
}

export async function up(): Promise<void> {
  try {
    // Создаём резервную копию перед миграцией
    await createBackup();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) return reject(err);

          // Создаём новую таблицу без ограничения UNIQUE на tokenGitLab
          db.run(
            `
            CREATE TABLE chatConfig_new (
              id INTEGER PRIMARY KEY,
              chatId INTEGER UNIQUE,
              chatTitle TEXT,
              gitBaseUrl TEXT,
              tokenGitLab TEXT
            )
          `,
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }

              // Копируем данные из старой таблицы в новую
              db.run(
                `
              INSERT INTO chatConfig_new (id, chatId, chatTitle, gitBaseUrl, tokenGitLab)
              SELECT id, chatId, chatTitle, gitBaseUrl, tokenGitLab FROM chatConfig
            `,
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }

                  // Удаляем старую таблицу
                  db.run('DROP TABLE chatConfig', (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    // Переименовываем новую таблицу в оригинальное имя
                    db.run(
                      'ALTER TABLE chatConfig_new RENAME TO chatConfig',
                      (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return reject(err);
                        }

                        db.run('COMMIT', (err) => {
                          if (err) return reject(err);
                          logger.info(
                            '✅ Миграция успешно завершена: ограничение UNIQUE удалено с поля tokenGitLab',
                          );
                          resolve();
                        });
                      },
                    );
                  });
                },
              );
            },
          );
        });
      });
    });
  } catch (error) {
    logger.error({ error }, 'Ошибка миграции');
    throw error;
  }
}

export async function down(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) return reject(err);

        // Создаём новую таблицу С ограничением UNIQUE на tokenGitLab (откат)
        db.run(
          `
          CREATE TABLE chatConfig_new (
            id INTEGER PRIMARY KEY,
            chatId INTEGER UNIQUE,
            chatTitle TEXT,
            gitBaseUrl TEXT,
            tokenGitLab TEXT UNIQUE
          )
        `,
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }

            // Копируем данные из старой таблицы в новую
            db.run(
              `
            INSERT INTO chatConfig_new (id, chatId, chatTitle, gitBaseUrl, tokenGitLab)
            SELECT id, chatId, chatTitle, gitBaseUrl, tokenGitLab FROM chatConfig
          `,
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return reject(err);
                }

                // Удаляем старую таблицу
                db.run('DROP TABLE chatConfig', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }

                  // Переименовываем новую таблицу в оригинальное имя
                  db.run(
                    'ALTER TABLE chatConfig_new RENAME TO chatConfig',
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                      }

                      db.run('COMMIT', (err) => {
                        if (err) return reject(err);
                        logger.info(
                          '✅ Откат выполнен успешно: ограничение UNIQUE восстановлено на поле tokenGitLab',
                        );
                        resolve();
                      });
                    },
                  );
                });
              },
            );
          },
        );
      });
    });
  });
}

// Запуск миграции при прямом выполнении файла
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'up') {
    up()
      .then(() => {
        logger.info('Миграция вверх успешно завершена');
        process.exit(0);
      })
      .catch((err) => {
        logger.error({ err }, 'Ошибка миграции вверх');
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        logger.info('Миграция вниз успешно завершена');
        process.exit(0);
      })
      .catch((err) => {
        logger.error({ err }, 'Ошибка миграции вниз');
        process.exit(1);
      });
  } else {
    logger.error(
      'Неверная команда. Использование: tsx src/db/migrations/removeTokenUniqueConstraint.ts [up|down]',
    );
    process.exit(1);
  }
}
