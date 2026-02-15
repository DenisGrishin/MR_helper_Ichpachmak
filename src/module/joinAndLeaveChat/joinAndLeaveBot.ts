import { MyContext } from '../../type';
import { ChatСonfig } from '../../db';
import { addBotToChat } from './addBotToChat';

export const joinAndLeaveBot = async (ctx: MyContext) => {
  const chatId = String(ctx.chat?.id);
  const chatTitle = ctx.chat?.title || chatId;

  const newStatus = ctx.myChatMember?.new_chat_member.status;

  if (newStatus === 'member') {
    addBotToChat(ctx, newStatus, chatTitle);
    console.log(`Бота добавлен в чат ${chatId}`);
  }

  if (newStatus === 'left' || newStatus === 'kicked') {
    ChatСonfig.delete(chatId);
    console.log(`Бота удалили из чата ${chatId}`);
  }
};
