import { InlineKeyboard } from 'grammy';
import { MyContext } from '../../type';

export const joinNewUser = async (ctx: MyContext) => {
  console.log('ctx ==> ', ctx);
  const members = ctx.message?.new_chat_members;
  if (!members?.length) return;

  const keyboard = new InlineKeyboard();

  for (const member of members) {
    keyboard
      .text(
        `Добавить ${member.first_name}`,
        `setUser${ctx.chat?.id}-${member.username}`,
      )
      .row();
  }

  if (ctx.from?.id) {
    await ctx.api.sendMessage(
      ctx.from.id,
      `Новый участник в чате "${ctx.chat?.title}". Хотите добавить его в базу данных?`,
      { reply_markup: keyboard },
    );
  }
};
