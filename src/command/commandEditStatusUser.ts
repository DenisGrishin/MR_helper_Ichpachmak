import { InlineKeyboard } from 'grammy';
import { chunkInlineKeyboardUser } from '../keyboards/keyboard';
import { TCallbackQueryContext } from '../type';
import { findUserById, getAllUsers } from '../db/helpers';
import { Users } from '../db';

export const commandEditStatusUser = async (ctx: TCallbackQueryContext) => {
  const listUsers = await getAllUsers();

  const keyboardUser = InlineKeyboard.from(
    chunkInlineKeyboardUser({ list: listUsers, textQuery: 'editStatus' })
  );

  ctx.callbackQuery.message?.editText(
    'Нажмите на пользователя, чтобы изменить его статус.\n\n✅ Активный пользователь — будет упоминаться при отправке MR.\n\n❌ Неактивный пользователь — не будет упоминаться.',
    {
      reply_markup: keyboardUser,
    }
  );
  ctx.answerCallbackQuery();
};

export const commandButtonEditUser = async (ctx: TCallbackQueryContext) => {
  const id = Number(ctx.callbackQuery.data.split('-')[1]);
  ctx.answerCallbackQuery();
  const user = await findUserById(id, 'users');

  const statusIsActive = !user?.isActive ? 1 : 0;

  Users.update(id, statusIsActive, (err) => {
    if (err) console.error(err);
  });

  commandEditStatusUser(ctx);
};
