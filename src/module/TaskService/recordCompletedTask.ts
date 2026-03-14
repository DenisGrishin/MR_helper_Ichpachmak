import { Users } from '../../db';
import { ChatMembers } from '../../db/chatMembers';
import { logger } from '../../config';

export const recordCompletedTask = async ({
  taskNumber,
  completedTasks,
  chatInternalId,
  userInternalId,
}: {
  taskNumber: string;
  completedTasks: string[];
  chatInternalId: number;
  userInternalId: number;
}) => {
  try {
    logger.info(
      `Запись выполненной задачи: ${taskNumber} для пользователя ${userInternalId}`,
    );

    if (completedTasks.includes(taskNumber)) {
      logger.warn(`Задача ${taskNumber} уже есть в списке выполненных`);
      return;
    }

    ChatMembers.updateField(userInternalId, chatInternalId, {
      completedTasks: JSON.stringify([...completedTasks, taskNumber]),
    });

    logger.info(`Задача ${taskNumber} успешно записана как выполненная`);
  } catch (error) {
    logger.error(
      `Ошибка в recordCompletedTask: ${error instanceof Error ? error.message : error}`,
    );
  }
};
