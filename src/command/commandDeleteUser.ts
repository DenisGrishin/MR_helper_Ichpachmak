import { InlineKeyboard } from 'grammy';
import {
  chunkInlineKeyboardUser,
  keyboardAskUserConfirmation,
} from '../keyboards/keyboard';
import { TCallbackQueryContext } from '../type';
import { findUser, getAllUsers } from '../db/helpers';
import { User } from '../db/db';
import { KeyCommand } from './constant';

export const commandDeleteUser = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const listUsers = await getAllUsers();

  const keyboardUser = InlineKeyboard.from(
    chunkInlineKeyboardUser({ list: listUsers, textQuery: 'delete' })
  );

  ctx.callbackQuery.message?.editText(
    'Нажмите на пользователя, чтобы  его удлаить.',
    {
      reply_markup: keyboardUser,
    }
  );
};

export const commandButtonDeleteUser = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const id = Number(ctx.callbackQuery.data.split('-')[1]);
  const user = await findUser(id, 'id');

  ctx.session.keyCommand = KeyCommand.delete;
  ctx.session.userId = Number(user?.id);

  ctx.callbackQuery.message?.editText(
    `Вы уверены, что хотите удалить этого пользователя ${user?.name}?`,
    {
      reply_markup: keyboardAskUserConfirmation,
    }
  );
};

export const deleteUser = async (id: number) => {
  if (!id) throw new Error('Нет такого id');

  User.delete(id, (err) => {
    if (err) console.error(err);
  });
};
