import { ChatСonfig } from '../../db';
import { syncUsersWithDb } from '../../db/helpers';
import { MyContext, TCallbackQueryContext } from '../../type';
import { showErrorMsg } from './helper';
import { logger } from '../../config';

// добавления юзера, когда его добавляют в чат
export const handleSetUserToChat = async (ctx: TCallbackQueryContext) => {
  try {
    ctx.answerCallbackQuery();
    const chatId = Number(ctx.callbackQuery.data.split(':')[1]);
    const userTag = `@${ctx.callbackQuery.data.split(':')[2]}`;

    logger.info(`Обработка добавления пользователя ${userTag} в чат ${chatId}`);

    const chat = await ChatСonfig.findByTelegramId(chatId);

    setUser(ctx, chat.id, chat.chatTitle, userTag);
  } catch (error) {
    logger.error(
      `Ошибка в handleSetUserToChat: ${error instanceof Error ? error.message : error}`,
    );
  }
};

// добавления юзера через команду /set_user
export const setUser = async (
  ctx: MyContext,
  chatInternalId: number | null | undefined,
  chatTitle: string,
  userTags?: string,
) => {
  try {
    const msgUserNames = userTags
      ? [userTags]
      : ctx.message?.text?.match(/@\w+/g);

    if (!msgUserNames) {
      logger.warn('Не указаны теги пользователей для добавления');
      showErrorMsg('Отправьте теги кого хотите добавить в базу.', ctx);
      return;
    } else if (!chatInternalId) {
      logger.error('chatId отсутствует в сессии');
      showErrorMsg('chatId отсутствует в сессии', ctx);
      throw new Error('chatId отсутствует в сессии');
    }

    logger.info(
      `Добавление пользователей в чат ${chatTitle}: ${msgUserNames.join(', ')}`,
    );

    const { newUsersChat, alreadyInChat } = await syncUsersWithDb(
      chatInternalId,
      msgUserNames,
    );

    if (newUsersChat?.length) {
      logger.info(`Новые пользователи добавлены: ${newUsersChat.join(', ')}`);
    }

    if (alreadyInChat.length) {
      logger.info(
        `Пользователи уже существуют в чате: ${alreadyInChat.join(', ')}`,
      );
    }

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

    logger.info('Ответ пользователю отправлен успешно');
  } catch (error) {
    logger.error(
      `Ошибка в setUser: ${error instanceof Error ? error.message : error}`,
    );
  }
};
