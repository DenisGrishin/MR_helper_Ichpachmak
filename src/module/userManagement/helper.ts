import { Context, InlineKeyboard } from 'grammy';
import { chunkInlineKeyboardUser } from '../../keyboards/keyboard';
import { TCallbackQueryContext } from '../../type';
import { CommandAction } from '../../keyboards/type';
import { Users } from '../../db';

interface IMessageBotArgs {
  messageId: number;
  successValue: string[];
  usersToUpdate: string[];
  warningValue?: string[];
  ctx: Context;
  textSuccess?: string;
  textWarning?: string;
  textUpdateUser?: string;
}

export const replyMessageBot = async ({
  messageId,
  successValue,
  usersToUpdate,
  warningValue,
  ctx,
  textSuccess = '',
  textWarning = '',
  textUpdateUser = '',
}: IMessageBotArgs) => {
  const isWarning = !!warningValue?.length;
  const isSuccess = !!successValue.length;
  const isUpdate = !!usersToUpdate.length;

  const messageSuccessNameDb = isSuccess
    ? `✅ ${textSuccess}: ${successValue.join(', ')}`
    : '';

  const messageWarningNameDb = isWarning
    ? `⚠️ ${textWarning}: ${warningValue?.join(', ')}`
    : '';

  const messageUsersToUpdateNameDb = isUpdate
    ? `🆙 ${textUpdateUser}: ${usersToUpdate?.join(', ')}`
    : '';

  await ctx.reply(
    `${messageSuccessNameDb}\n\n${messageWarningNameDb}\n\n${messageUsersToUpdateNameDb}`,
    {
      reply_parameters: { message_id: messageId },
    },
  );
};

export const showErrorMsg = async (msgError: string, ctx: Context) => {
  await ctx.reply(`⚠️ ${msgError}`, {
    reply_parameters: { message_id: ctx.msg!.message_id },
  });
};

const getListUsers = async (chatInternalId: number, isAll: boolean = false) => {
  if (isAll) {
    const selectChatUsers = await Users.findUsersByChatId(
      chatInternalId,
      ['id', 'name'],
      [],
    );
    const allUsers = await Users.all();

    const selectChatUsersId = (selectChatUsers as any).map(
      (user: any) => user.id,
    );

    return allUsers.map((user) => {
      if (selectChatUsersId.includes(user.id)) {
        return { ...user, isActive: 1 };
      }
      return user;
    });
  }

  return await Users.findUsersByChatId(
    chatInternalId,
    ['id', 'name'],
    ['isActive'],
  );
};

export const createListUsers = async (
  ctx: TCallbackQueryContext,
  action: CommandAction,
  chatInternalId: number,
) => {
  const listUsers = await getListUsers(
    chatInternalId,
    action === 'addUserToChat',
  );

  if (!chatInternalId) {
    throw new Error('chatId отсутствует в сессии');
  }

  const keyboardUser = InlineKeyboard.from(
    chunkInlineKeyboardUser({
      list: listUsers,
      action,
      chatInternalId,
    }),
  );

  let messageText = `<b>Чат ${ctx.session.chatTitle?.toUpperCase()}</b>\n\n`;

  switch (action) {
    case 'editStatusSendMR':
      messageText +=
        'Нажмите на пользователя, чтобы изменить его статус.\n\n' +
        '✅ Активный пользователь — будет упоминаться при отправке MR.\n' +
        '❌ Неактивный пользователь — не будет упоминаться.';
      break;

    case 'delete':
      messageText +=
        'Нажмите на пользователя, чтобы его удалить.\n\n' +
        'ВНИМАНИЕ!!! ПОЛЬЗОВАТЕЛЬ УДАЛИТЬСЯ ИЗ ВСЕХ ЧАТОВ.';
      break;

    case 'deleteFromChat':
      messageText += 'Нажмите на пользователя, чтобы удалить его из чата.';
      break;

    case 'addUserToChat':
      messageText +=
        'Нажмите на пользователя, чтобы добавить его в чат.\n' +
        '✅ Пользователь уже есть в этом чате.\n' +
        '❌ Его нет в чате.';
      break;

    default:
      console.warn('Неизвестное действие:', action);
      break;
  }

  await ctx.callbackQuery.message?.editText(messageText, {
    reply_markup: keyboardUser,
    parse_mode: 'HTML',
  });

  ctx.answerCallbackQuery();
};
