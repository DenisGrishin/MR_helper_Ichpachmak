import { keyboardAskUserConfirmation } from '../keyboards/keyboard';
import { TCallbackQueryContext } from '../type';
import { findUserById } from '../db/helpers';
import { Users } from '../db';
import { KeyCommand } from './constant';

export const commandButtonDeleteUser = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const id = Number(ctx.callbackQuery.data.split('-')[1]);

  const user = await findUserById(id, 'users');

  ctx.session.keyCommand = KeyCommand.delete;
  ctx.session.userId = Number(user?.id);

  ctx.callbackQuery.message?.editText(
    `Вы уверены, что хотите удалить этого пользователя ${user?.name}?`,
    {
      reply_markup: keyboardAskUserConfirmation,
    },
  );
};

export const deleteUser = async (id: number) => {
  if (!id) throw new Error('Нет такого id');

  await Users.delete(id, 'tasksUsers');
  await Users.delete(id, 'users');
};
