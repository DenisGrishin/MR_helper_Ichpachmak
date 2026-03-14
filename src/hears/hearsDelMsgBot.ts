import type { Context } from 'grammy';
import { logger } from '../config';

export const hearsDelMsgBot = async (ctx: Context) => {
  logger.info('Обработка запроса на удаление сообщения бота');

  const replyToMessageId = ctx.message?.reply_to_message?.message_id;
  const botId = ctx.message?.reply_to_message?.from?.id;
  const fromUser = ctx.message?.from?.username;

  const currentBotId = ctx.me?.id;

  if (replyToMessageId && botId === currentBotId) {
    await ctx.api.deleteMessage(ctx.chat!.id, replyToMessageId);
    await ctx.reply(`🗑️ Вы удалили сообещния бота. @${fromUser}`, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });
    logger.info(`Сообщение бота удалено пользователем @${fromUser}`);
  } else {
    await ctx.reply(`Бот может удалять только свои собственные сообщения.`, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });
    logger.info('Отказ в удалении: сообщение не является сообщением бота');
  }
};
