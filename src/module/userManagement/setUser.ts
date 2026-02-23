import { ChatСonfig } from '../../db';
import { syncUsersWithDb } from '../../db/helpers';
import { MyContext, TCallbackQueryContext } from '../../type';
import { showErrorMsg } from './helper';

// добавления юзера, когда его добавляют в чат
export const handleSetUserToChat = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const chatId = Number(ctx.callbackQuery.data.split(':')[1]);
  const userTag = `@${ctx.callbackQuery.data.split(':')[2]}`;

  const chat = await ChatСonfig.findByTelegramId(chatId);

  setUser(ctx, chat.id, chat.chatTitle, userTag);
};

// добавления юзера через команду /set_user
export const setUser = async (
  ctx: MyContext,
  chatInternalId: number | null | undefined,
  chatTitle: string,
  userTags?: string,
) => {
  const msgUserNames = userTags
    ? [userTags]
    : ctx.message?.text?.match(/@\w+/g);

  if (!msgUserNames) {
    showErrorMsg('Отправьте теги кого хотите добавить в базу.', ctx);
    return;
  } else if (!chatInternalId) {
    showErrorMsg('chatId отсутствует в сессии', ctx);
    throw new Error('chatId отсутствует в сессии');
  }

  const { newUsersChat, alreadyInChat } = await syncUsersWithDb(
    chatInternalId,
    msgUserNames,
  );

  const successMsg = newUsersChat?.length
    ? `✅ Эти(-от) пользователи(-ль) ${newUsersChat?.join(', ')}, был(-и) добавлен(-ы) в чат ${chatTitle}\n\n`
    : '';

  const warningMsg = alreadyInChat.length
    ? `⚠️Эти(-от) пользователи(-ль) ${alreadyInChat?.join(', ')} уже существуют в чате.`
    : '';

  ctx.reply(
    `
${successMsg + warningMsg}
    `,
  );

  console.log(successMsg + warningMsg);
};
