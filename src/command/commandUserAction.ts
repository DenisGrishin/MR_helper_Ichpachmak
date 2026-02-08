import { InlineKeyboard } from 'grammy';
import { chunkInlineKeyboardUser } from '../keyboards/keyboard';
import { TCallbackQueryContext } from '../type';
import { findUserById, getAllUsers } from '../db/helpers';
import { Users } from '../db';
import { findUsersInCurrentChat } from '../helper/helper';
import { CommandAction } from '../keyboards/type';

export const commandUserAction = async (
  ctx: TCallbackQueryContext,
  action: CommandAction,
) => {
  const listUsers = await getAllUsers();
  const chatId = ctx.session.chatId;

  if (!chatId) {
    throw new Error('chatId отсутствует в сессии');
  }

  const usersInCurrentChat = findUsersInCurrentChat(chatId, listUsers);

  const keyboardUser = InlineKeyboard.from(
    chunkInlineKeyboardUser({ list: usersInCurrentChat, action }),
  );

  let messageText = `<b>Чат ${ctx.session.chatTitle?.toUpperCase()}</b>\n\n`;

  if (action === 'editStatus') {
    messageText +=
      'Нажмите на пользователя, чтобы изменить его статус.\n\n' +
      '✅ Активный пользователь — будет упоминаться при отправке MR.\n' +
      '❌ Неактивный пользователь — не будет упоминаться.';
  } else if (action === 'delete') {
    messageText += 'Нажмите на пользователя, чтобы его удалить.';
  }

  await ctx.callbackQuery.message?.editText(messageText, {
    reply_markup: keyboardUser,
    parse_mode: 'HTML',
  });

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

  commandUserAction(ctx, 'editStatus');
};
