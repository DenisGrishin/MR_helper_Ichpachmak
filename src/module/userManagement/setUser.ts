import { findUserById, Users } from '../../db';
import { syncUsersWithDb } from '../../db/helpers';
import { MyContext, TCallbackQueryContext } from '../../type';
import { TEXT_MSG_1 } from './constanta';
import { replyMessageBot, showErrorMsg } from './helper';

export const handleSetUserToChat = async (ctx: TCallbackQueryContext) => {
  // TODO надо дописать
  const chatId = Number(ctx.callbackQuery.data.split(':')[1]);
  const name = ctx.callbackQuery.data.split(':')[2];
  const user = await findUserById(`@${name}`, 'users', 'name');

  if (!user) {
    Users.create([`@${name}`], chatId, (err) => { 
      if (err) return;
    });
  }

  ctx.answerCallbackQuery();
};

export const setUser = async (
  ctx: MyContext,
  chatInternalId: number | null | undefined,
  chatTitle: string,
) => {
  const msgUserNames = ctx.message?.text?.match(/@\w+/g);

  if (!msgUserNames) {
    showErrorMsg('Отправьте теги кого хотите добавить в базу.', ctx);
    return;
  } else if (!chatInternalId) {
    showErrorMsg('chatId отсутствует в сессии', ctx);
    throw new Error('chatId отсутствует в сессии');
  }

  const { notFindUsersBd, usersNameBd } = await syncUsersWithDb(
    chatInternalId,
    msgUserNames,
  );

  await replyMessageBot({
    messageId: ctx.msg!.message_id,
    successValue: notFindUsersBd || [],
    warningValue: usersNameBd,
    usersToUpdate: ['s'].map((u) => u.name),
    textSuccess: `${TEXT_MSG_1} были добавлены в базу`,
    textWarning: `${TEXT_MSG_1}  уже существуют в базе и добавлены в чат  ${chatTitle}`,
    textUpdateUser: `${TEXT_MSG_1} добавлен(-ны) в новый чат ${chatTitle}`,
    ctx,
  });
};
