import type { Context } from 'grammy';

export const hearsDelMsgBot = async (ctx: Context) => {
  const replyToMessageId = ctx.message?.reply_to_message?.message_id;
  const botId = ctx.message?.reply_to_message?.from?.id;
  const fromUser = ctx.message?.from?.username;

  // тут использую id самого бота 7704113161 для удаления его сообщений
  if (replyToMessageId && botId === 7704113161) {
    await ctx.api.deleteMessage(ctx.chat!.id, replyToMessageId);
    await ctx.reply(`🗑️ Вы удалили сообещния бота. @${fromUser}`, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });
  } else {
    await ctx.reply(`Бот может удалять только свои собственные сообщения.`, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });
  }
};
