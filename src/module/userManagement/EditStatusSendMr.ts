import { ChatMembers } from '../../db/chatMembers';
import { TCallbackQueryContext } from '../../type';
import { createListUsers } from './helper';
import { logger } from '../../config';

export const handlerEditStatusSendMrUser = async (
  ctx: TCallbackQueryContext,
) => {
  try {
    await ctx.answerCallbackQuery();
    const userId = Number(ctx.callbackQuery.data.split(':')[1]);
    const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);

    logger.info(
      `Обработка изменения статуса отправки MR для пользователя ${userId} в чате ${chatInternalId}`,
    );

    const user = await ChatMembers.findChatMember(userId, chatInternalId, [
      'isActive',
    ]);

    const statusIsActive = !user?.isActive ? 1 : 0;

    await ChatMembers.updateField(userId, chatInternalId, {
      isActive: statusIsActive,
    });

    logger.info(
      `Статус отправки MR изменен на "${statusIsActive ? 'активный' : 'неактивный'}" для пользователя ${userId}`,
    );

    await createListUsers(ctx, 'editStatusSendMR', chatInternalId);
    logger.info('Список пользователей обновлен после изменения статуса');
  } catch (error) {
    logger.error(
      `Ошибка в handlerEditStatusSendMrUser: ${error instanceof Error ? error.message : error}`,
    );
  }
};
