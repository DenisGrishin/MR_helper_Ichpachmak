import { InlineKeyboard } from 'grammy';
import { MyContext } from '../../type';

export const joinNewUserToChat = async (ctx: MyContext) => {
  const members = ctx.message?.new_chat_members;
  if (!members?.length) return;

  const keyboard = new InlineKeyboard();

  for (const member of members) {
    keyboard
      .text('❌ Не добавлять')
      .text(
        `✅ Добавить ${member.first_name}`,
        `setUser:${ctx.chat?.id}:${member.username}`,
      );
  }

  if (ctx.from?.id) {
    await ctx.api.sendMessage(
      ctx.from.id,
      `Новый участник в чате "${ctx.chat?.title}". Хотите добавить его в базу данных?`,
      { reply_markup: keyboard },
    );
  }
};
