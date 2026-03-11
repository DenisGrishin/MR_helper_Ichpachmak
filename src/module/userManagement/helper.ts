import { Context, InlineKeyboard } from 'grammy';
import { chunkInlineKeyboardUser } from '../../keyboards/keyboard';
import { TCallbackQueryContext } from '../../type';
import { CommandAction } from '../../keyboards/type';
import { Users } from '../../db';
import { ChatMembers } from '../../db/chatMembers';
import { KeyCommand } from '../../constant/constant';

export const showErrorMsg = async (msgError: string, ctx: Context) => {
  await ctx.reply(`⚠️ ${msgError}`, {
    reply_parameters: { message_id: ctx.msg!.message_id },
  });
};

const getListUsers = async (chatInternalId: number, isAll: boolean = false) => {
  if (isAll) {
    const selectChatUsers = await ChatMembers.findChatMembersWithFields(
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

  return await ChatMembers.findChatMembersWithFields(
    chatInternalId,
    ['id', 'name'],
    ['isActive', 'preset'],
  );
};

export const createListUsers = async (
  ctx: TCallbackQueryContext,
  action: CommandAction,
  chatInternalId: number,
) => {
  const listUsers = await getListUsers(chatInternalId);

  if (!chatInternalId) {
    throw new Error('chatId отсутствует в сессии');
  }

  const authorData = (listUsers as any).find(
    (el: any) => el.name === `@${ctx.from.username}`,
  );

  if (!authorData) {
    console.log(`Вас ${ctx.from.username} нет в этом чате`);
    try {
      await ctx.callbackQuery.message?.editText(
        `Вас @${ctx.from.username} нет в этом чате`,
        {
          reply_markup: new InlineKeyboard().text(
            '< Назад',
            KeyCommand.backToMenu,
          ),
        },
      );
    } catch (err) {
      console.error('Не удалось отредактировать сообщение:', err);
    }
    return;
  }

  const keyboardUser = InlineKeyboard.from(
    chunkInlineKeyboardUser({
      list: listUsers,
      action,
      chatInternalId,
      authorData,
    }),
  );

  let messageText = `Чат ${ctx.session.chatTitle?.toUpperCase()}\n\n`;

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

    case 'updatePreset':
      messageText +=
        'Нажмите на пользователя, чтобы добавить в пресет.\n\n' +
        '✅ Пользователь добавлен в пресет.\n' +
        '❌ Пользоветель не добавлен в пресет.';
      break;
    default:
      console.warn('Неизвестное действие:', action);
      break;
  }

  try {
    await ctx.callbackQuery.message?.editText(messageText, {
      reply_markup: keyboardUser,
    });
  } catch (err) {
    console.error(
      'Не удалось отредактировать сообщение со списком пользователей:',
      err,
    );
  }

  try {
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error('Не удалось ответить на callback query:', err);
  }
};
