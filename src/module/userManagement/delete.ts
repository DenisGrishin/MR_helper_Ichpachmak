import { KeyCommand } from '../../constant/constant';
import { findUserById, Users } from '../../db';
import { createKeyboardAskUserConfirmation } from '../../keyboards/keyboard';
import { TCallbackQueryContext } from '../../type';

export const handlerDeleteUser = async ({
  ctx,
  text,
  action,
}: {
  ctx: TCallbackQueryContext;
  text: string;
  action: 'delete' | 'deleteFromChat';
}) => {
  ctx.answerCallbackQuery();
  const userInternalId = Number(ctx.callbackQuery.data.split(':')[1]);
  const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);

  const user = await Users.findUser(userInternalId, (err, users) => {
    if (err) {
      console.error(err);
    } else if (users && users.length > 0) {
      console.log('Пользователь найден:', users[0]);
    } else {
      console.log('Пользователь с таким id не найден');
    }
  });

  ctx.callbackQuery.message?.editText(`${text}\n\n${user?.name}?`, {
    reply_markup: createKeyboardAskUserConfirmation(
      chatInternalId,
      userInternalId,
      KeyCommand[action],
    ),
  });
};

export const deleteUser = async (id: number) => {
  if (!id) throw new Error('Нет такого id');

  await Users.deleteUser(id);
};

export const deleteChatMebers = async (
  userInternalId: number,
  chatInternalId: number,
) => {
  if (!userInternalId) throw new Error('Нет такого userInternalId');

  await Users.deleteChatMember(userInternalId, chatInternalId);
};
