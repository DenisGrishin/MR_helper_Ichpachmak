import { MyContext } from '../../type';
import { ChatСonfig } from '../../db';
import { addBotToChat } from './addBotToChat';

export const joinBot = async (ctx: MyContext) => {
  const chatId = String(ctx.chat?.id);
  const chatTitle = ctx.chat?.title || chatId;

  const bot = await ctx.getChatMember(ctx.me.id);

  if (bot.user.id !== ctx.me.id) {
    console.log(`Был добавлен какой-то бот ${bot.user.username}`);
    return;
  }

  if (bot.status === 'member') {
    addBotToChat(ctx, chatTitle);
  }
};

export const leaveBot = async (ctx: MyContext) => {
  const chatId = String(ctx.chat?.id);

  const newStatus = ctx.myChatMember?.new_chat_member.status;

  if (newStatus === 'left' || newStatus === 'kicked') {
    await ChatСonfig.delete(chatId);
    console.log(`Бота удалили из чата ${chatId}`);
  }
};
