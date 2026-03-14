import { MyContext } from '../../type';
import { ChatСonfig } from '../../db';
import { addBotToChat } from './addBotToChat';
import { logger } from '../../config';

export const joinBot = async (ctx: MyContext) => {
  try {
    const chatId = String(ctx.chat?.id);
    const chatTitle = ctx.chat?.title || chatId;

    logger.info(`Попытка добавления бота в чат: ${chatTitle}`);

    const bot = await ctx.getChatMember(ctx.me.id);

    if (bot.user.id !== ctx.me.id) {
      logger.info(`Был добавлен другой бот: ${bot.user.username}`);
      return;
    }

    if (bot.status === 'member') {
      logger.info(`Бот успешно добавлен в чат: ${chatTitle}`);
      addBotToChat(ctx, chatTitle);
    } else {
      logger.warn(`Бот имеет статус ${bot.status} в чате: ${chatTitle}`);
    }
  } catch (error) {
    logger.error(
      `Ошибка в joinBot: ${error instanceof Error ? error.message : error}`,
    );
  }
};

export const leaveBot = async (ctx: MyContext) => {
  try {
    const chatId = String(ctx.chat?.id);

    const newStatus = ctx.myChatMember?.new_chat_member.status;

    if (newStatus === 'left' || newStatus === 'kicked') {
      logger.info(`Бот покидает чат: ${chatId}, статус: ${newStatus}`);
      await ChatСonfig.delete(chatId);
      logger.info(`Конфигурация чата ${chatId} удалена из базы данных`);
    }
  } catch (error) {
    logger.error(
      `Ошибка в leaveBot: ${error instanceof Error ? error.message : error}`,
    );
  }
};
