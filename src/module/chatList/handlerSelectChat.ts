import { handleCommand } from '../../command/handleCommand';
import { KeyCommand } from '../../constant/constant';
import { TCallbackQueryContext } from '../../type';
import { actionEditConfig } from '../chatConfig/edit';
import { showCompletedTasks } from '../TaskService/showCompletedTasks';
import { createListUsers } from '../userManagement/helper';
import { showAllUser } from '../userManagement/showAllUser';
import { logger } from '../../config';

export const handlerSelectChat = (ctx: TCallbackQueryContext) => {
  try {
    ctx.answerCallbackQuery().catch(() => {});

    const chatInternalId = Number(ctx.callbackQuery.data.split(':')[1]);
    const chatId = Number(ctx.callbackQuery.data.split(':')[2]);
    const chatTitle = String(ctx.callbackQuery.data.split(':')[3]);
    const action = String(ctx.callbackQuery.data.split(':')[4]);

    logger.info(
      `Выбран чат: ${chatTitle} (ID: ${chatInternalId}, действие: ${action})`,
    );

    // TODO сделать уникалтные ключи и потом удалять
    ctx.session.chatInternalId = chatInternalId;
    ctx.session.chatId = chatId;
    ctx.session.chatTitle = chatTitle;

    switch (action) {
      case 'editStatusSendMR':
        logger.info('Переход к редактированию статуса отправки MR');
        createListUsers(ctx, 'editStatusSendMR', chatInternalId);
        break;
      case 'delete':
        logger.info('Переход к удалению пользователя');
        createListUsers(ctx, 'delete', chatInternalId);
        break;
      case 'setUser':
        logger.info('Переход к добавлению пользователя');
        handleCommand(ctx, KeyCommand.setUser);
        break;
      case 'completedTasks':
        logger.info('Переход к просмотру выполненных задач');
        showCompletedTasks(ctx, chatInternalId);
        break;
      case 'allUser':
        logger.info('Переход к просмотру всех пользователей');
        showAllUser(ctx, chatInternalId);
        break;
      case 'editChatConfig':
        logger.info('Переход к редактированию конфигурации чата');
        actionEditConfig(
          ctx,
          `Вы выбрали чат: ${chatTitle}. Что вы хотите отредактировать?`,
          chatId,
        );
        break;
      case 'updatePreset':
        logger.info('Переход к обновлению пресета');
        createListUsers(ctx, 'updatePreset', chatInternalId);
        break;
      default:
        logger.warn(`Неизвестное действие: ${action}`);
        break;
    }
  } catch (error) {
    logger.error(
      `Ошибка в handlerSelectChat: ${error instanceof Error ? error.message : error}`,
    );
  }
};
