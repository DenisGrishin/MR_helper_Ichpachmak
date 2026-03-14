import { InlineKeyboard } from 'grammy';
import { MyContext } from '../../type';
import { logger } from '../../config';

export const joinNewUserToChat = async (ctx: MyContext) => {
  try {
    const chatTitle = ctx.chat?.title || 'неизвестный чат';
    logger.info(`Обработка новых участников в чате: ${chatTitle}`);

    const members = ctx.message?.new_chat_members;
    if (!members?.length) {
      logger.warn('Список новых участников пуст');
      return;
    }

    const keyboard = new InlineKeyboard();

    for (const member of members) {
      keyboard
        .text('❌ Не добавлять')
        .text(
          `✅ Добавить ${member.first_name}`,
          `setUser:${ctx.chat?.id}:${member.username}`,
        );
      logger.info(
        `Добавлен участник в меню: ${member.first_name} (@${member.username})`,
      );
    }

    if (ctx.from?.id) {
      await ctx.api.sendMessage(
        ctx.from.id,
        `Новый участник в чате "${ctx.chat?.title}". Хотите добавить его в базу данных?`,
        { reply_markup: keyboard },
      );
      logger.info('Меню добавления пользователей отправлено успешно');
    } else {
      logger.warn('Не удалось определить пользователя для отправки сообщения');
    }
  } catch (error) {
    logger.error(
      `Ошибка в joinNewUserToChat: ${error instanceof Error ? error.message : error}`,
    );
  }
};
