import { ChatСonfig } from '../db';
import { ChatMembers } from '../db/chatMembers';
import { recordCompletedTask } from '../module/TaskService/recordCompletedTask';

import { MyContext } from '../type';
import { fetchMR, getTaskNumber, messageGenerator } from './helper';
import { Logger } from '../utils/logger';

// TODO вынести отдельно чтоб при старте сохрнять ативных пользватлей
export const hearsActiveMR = async (ctx: MyContext) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи

  const chatId = ctx.chat?.id;

  if (!chatId) {
    Logger.error('chatId отсутствует в сессии', {
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
    Logger.warn('Токен GitLab не настроен для чата', {
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
      Logger.error('Не удалось отправить сообщение об отсутствии токена', {
        chatId,
        error: err instanceof Error ? err.message : err,
        function: 'hearsActiveMR',
      });
    }
    return;
  }

  const MR = await fetchMR(ctx, chatInternalId.tokenGitLab);

  if (!MR) {
    Logger.warn('MR не получен', {
      chatId,
      chatInternalId: chatInternalId.id,
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
    Logger.info('Сообщение пользователя удалено', {
      chatId,
      messageId: ctx.message!.message_id,
      userId: ctx.from?.id,
    });
  } catch (err) {
    Logger.error('Не удалось удалить сообщение пользователя', {
      chatId,
      messageId: ctx.message!.message_id,
      error: err instanceof Error ? err.message : err,
      function: 'hearsActiveMR',
    });
  }

  if (taskNumber !== 'UNKNOWN') {
    Logger.info('Запись выполненной задачи', {
      taskNumber,
      chatId,
      chatInternalId: chatInternalId.id,
      function: 'hearsActiveMR',
    });
    recordCompletedTask({
      taskNumber,
      completedTasks: JSON.parse(usersInCurrentChat?.completedTasks ?? '[]'),
      chatInternalId: chatInternalId.id,
      userInternalId: usersInCurrentChat?.id as number,
    });
  }

  try {
    // @ts-ignore
    await ctx.reply(message, {
      disable_web_page_preview: true,
    } as any);
    Logger.success('Сообщение MR успешно отправлено', {
      chatId,
      taskNumber,
      authorMR,
      activeUsersCount: usersTags.split(' ').filter(Boolean).length,
      function: 'hearsActiveMR',
    });
  } catch (err) {
    Logger.error('Не удалось отправить сообщение MR', {
      chatId,
      taskNumber,
      error: err instanceof Error ? err.message : err,
      function: 'hearsActiveMR',
    });
  }
};
