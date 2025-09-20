import { Context } from 'grammy';
import { getAllUsers } from '../db/helpers';
import { IUser } from '../db/db';
import { TCallbackQueryContext } from '../type';

export const commandAllUser = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const users: IUser[] = await getAllUsers();
  const listUser = users
    .map((user) => `${user.name} — ${user.isActive ? '✅' : '❌'}\n`)
    .join('');

  await ctx.reply(
    `Список всех пользоватлей:\n${listUser.length ? listUser : 'Спсиок пуст.'}`,
    { reply_parameters: { message_id: ctx.msg!.message_id } }
  );
};
