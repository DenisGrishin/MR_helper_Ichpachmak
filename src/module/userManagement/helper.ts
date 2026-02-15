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

export const createListUsers = async (
  ctx: TCallbackQueryContext,
  action: CommandAction,
  chatInternalId: number,
) => {
  const listUsers = await Users.findUsersByChatId(
    chatInternalId,
    ['id', 'name'],
    ['isActive'],
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

  if (action === 'editStatusSendMR') {
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
