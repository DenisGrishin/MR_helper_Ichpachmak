import { ChatСonfig } from '../db';
import { ChatMembers } from '../db/chatMembers';
import { logger } from '../config';

import { MyContext } from '../type';
import {
  fetchMR,
  getTaskNumber,
  messageGenerator,
  recordTaskForAuthor,
} from './helper';

// TODO вынести отдельно чтоб при старте сохнять ативных пользватлей
export const hearsActiveMR = async (ctx: MyContext) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи

  const chatId = ctx.chat?.id;

  if (!chatId) {
    logger.error({
      msg: 'chatId отсутствует в сессии',
      userId: ctx.from?.id,
      username: ctx.from?.username,
      function: 'hearsActiveMR',
    });
    throw new Error('chatId отсутствует в сессии');
  }

  const chatInternalId = await ChatСonfig.findByTelegramId(chatId);

  const usersInCurrentChat: any = await ChatMembers.findChatMembersWithFields(
    chatInternalId.id,
    ['name', 'id'],
    ['isActive', 'completedTasks'],
  );

  const authorMR = `@${ctx?.from?.username}`;

  const usersTags = usersInCurrentChat
    .map((u: any) => {
      if (u.isActive) return u.name;
    })
    .filter((el: any) => el !== undefined && el !== authorMR)
    .join(' ');

  if (!chatInternalId.tokenGitLab) {
    logger.warn({
      msg: 'Токен GitLab не настроен для чата',
      chatId,
      chatInternalId: chatInternalId.id,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      function: 'hearsActiveMR',
    });
    try {
      await ctx.reply(
        '⚠️ Токен GitLab не настроен для этого чата.\n\n' +
          'Чтобы добавить токен:\n' +
          '1. Откройте личные сообщения с ботом\n' +
          '2. Используйте команду /menu\n' +
          '3. Выберите "Настройки чата проекта"\n' +
          '4. Нажмите "Изменить токен GitLab"\n' +
          '5. Введите ваш Personal Access Token от GitLab',
      );
    } catch (err) {
      logger.error({
        msg: 'Не удалось отправить сообщение об отсутствии токена',
        chatId,
        error: err instanceof Error ? err.message : err,
        function: 'hearsActiveMR',
      });
    }
    return;
  }

  const MR = await fetchMR(ctx, chatInternalId.tokenGitLab);

  if (!MR) {
    logger.warn({
      msg: 'MR не получен',
      chatId,
      chatInternalId: chatInternalId?.id,
      function: 'hearsActiveMR',
    });
    return;
  }

  const taskNumber = getTaskNumber(MR.source_branch);

  const message = messageGenerator({
    ctx,
    MR,
    usersTags,
    taskNumber,
    valueSliceLinkMR: 2,
  });

  try {
    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);
    logger.info({
      msg: 'Сообщение пользователя удалено',
      chatId,
      messageId: ctx.message!.message_id,
      userId: ctx.from?.id,
    });
  } catch (err) {
    logger.error({
      msg: 'Не удалось удалить сообщение пользователя',
      chatId,
      messageId: ctx.message!.message_id,
      error: err instanceof Error ? err.message : err,
      function: 'hearsActiveMR',
    });
  }

  if (taskNumber !== 'UNKNOWN') {
    const authorInChat = usersInCurrentChat.find(
      (u: any) => u.name === authorMR,
    );

    await recordTaskForAuthor({
      taskNumber,
      id: authorInChat.id,
      completedTasks: authorInChat.completedTasks,
      chatInternalId: chatInternalId.id,
      chatId,
      authorUsername: authorMR,
    });
  }

  try {
    // @ts-ignore
    await ctx.reply(message, {
      disable_web_page_preview: true,
    } as any);
    logger.info({
      msg: 'Сообщение MR успешно отправлено',
      chatId,
      taskNumber,
      authorMR,
      activeUsersCount: usersTags.split(' ').filter(Boolean).length,
      function: 'hearsActiveMR',
    });
  } catch (err) {
    logger.error({
      msg: 'Не удалось отправить сообщение MR',
      chatId,
      taskNumber,
      error: err instanceof Error ? err.message : err,
      function: 'hearsActiveMR',
    });
  }
};
