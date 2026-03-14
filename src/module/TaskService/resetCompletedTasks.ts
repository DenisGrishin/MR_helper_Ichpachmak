import nodeCron from 'node-cron';
import { ChatMembers } from '../../db/chatMembers';
import { logger } from '../../config';

export const resetCompletedTasks = () => {
  try {
    logger.info('Настройка cron-задачи для очистки выполненных задач');
    nodeCron.schedule('0 59 23 * * * *', () => {
      try {
        logger.info('Выполнение очистки списка выполненных задач');
        ChatMembers.clearField('completedTasks');
        logger.info('Список выполненных задач очищен у всех пользователей');
      } catch (error) {
        logger.error(
          `Ошибка при очистке выполненных задач: ${error instanceof Error ? error.message : error}`,
        );
      }
    });

    logger.info('Cron-задача настроена: ежедневно в 23:59');
  } catch (error) {
    logger.error(
      `Ошибка при настройке cron-задачи: ${error instanceof Error ? error.message : error}`,
    );
  }
};
