import { ChatСonfig, Users } from '../../db';
import { MyContext } from '../../type';
import { deleteChatMebers } from '../userManagement/delete';
import { logger } from '../../config';

export const leaveUserToChat = async (ctx: MyContext) => {
  try {
    const chatId = Number(ctx.chat?.id);
    const chat = await ChatСonfig.findByTelegramId(chatId);

    logger.info(`Обработка выхода пользователя из чата ID: ${chatId}`);

    const user = await Users.findUser(
      `@${ctx.from?.username}`,
      'name',
      (err, users) => {
        if (err) {
          logger.error(`Ошибка при поиске пользователя: ${err}`);
        } else if (users && users.length > 0) {
          logger.info(`Пользователь найден: ${users[0].name}`);
        } else {
          logger.warn('Пользователь с таким id не найден');
        }
      },
    );

    // TODO тут что то другое придумать, т.к при удалении бота дропает ошибку
    if (!user || !chat) {
      logger.warn('Не удалось найти пользователя или чат в базе данных');
      return;
    }

    await deleteChatMebers(user.id, chat.id);

    logger.info(
      `Пользователь ${ctx.from?.first_name} ${ctx.from?.last_name ?? ''} был удален из чата ${chat.chatTitle}`,
    );
  } catch (error) {
    logger.error(
      `Ошибка в leaveUserToChat: ${error instanceof Error ? error.message : error}`,
    );
  }
};
