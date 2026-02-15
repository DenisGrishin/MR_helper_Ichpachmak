import { KeyCommand } from '../../constant/constant';
import { findUserById, Users } from '../../db';
import { createKeyboardAskUserConfirmation } from '../../keyboards/keyboard';
import { TCallbackQueryContext } from '../../type';

export const handlerDeleteUser = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const id = Number(ctx.callbackQuery.data.split(':')[1]);
  const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);

  const user = await Users.findUser(id, (err, users) => {
    if (err) {
      console.error(err);
    } else if (users && users.length > 0) {
      console.log('Пользователь найден:', users[0]);
    } else {
      console.log('Пользователь с таким id не найден');
    }
  });

  ctx.callbackQuery.message?.editText(
    `Вы уверены, что хотите удалить этого пользователя ${user?.name}?`,
    {
      reply_markup: createKeyboardAskUserConfirmation(
        chatInternalId,
        id,
        KeyCommand.delete,
      ),
    },
  );
};

export const deleteUser = async (id: number) => {
  if (!id) throw new Error('Нет такого id');

  await Users.deleteUser(id);
};
