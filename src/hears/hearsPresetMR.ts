import { ChatСonfig, Users } from '../db';
import { ChatMembers } from '../db/chatMembers';
import { recordCompletedTask } from '../module/TaskService/recordCompletedTask';
import { MyContext } from '../type';
import { getTaskNumber, messageGenerator } from './helper';
import { fetchMR } from './helper/helper';
import { logger } from '../config';

export const hearsPresetMR = async (ctx: MyContext) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи

  const chatId = ctx.chat?.id;

  if (!chatId) {
    logger.error({
      msg: 'chatId отсутствует',
      userId: ctx.from?.id,
      username: ctx.from?.username,
      function: 'hearsPresetMR',
    });
    throw new Error('chatId отсутствует');
  }

  const chatInternalId = await ChatСonfig.findByTelegramId(chatId);

  const authorMR = `@${ctx?.from?.username}`;

  const currentUser: any = await Users.findUser(
    authorMR,
    'name',
    (err, users) => {
      if (err) {
        logger.error({
          msg: 'Ошибка при поиске пользователя',
          error: err instanceof Error ? err.message : err,
          authorMR,
          chatId,
          function: 'hearsPresetMR',
        });
      } else if (users && users.length > 0) {
        logger.info({
          msg: 'Пользователь найден',
          userId: users[0].id,
          username: users[0].name,
          authorMR,
          chatId,
          function: 'hearsPresetMR',
        });
      } else {
        logger.warn({
          msg: 'Пользователь с таким id не найден',
          authorMR,
          chatId,
          function: 'hearsPresetMR',
        });
      }
    },
  );

  const currentChatMember = await ChatMembers.findChatMember(
    currentUser.id,
    chatInternalId.id,
    ['preset', 'completedTasks'],
  );

  const preset = JSON.parse(currentChatMember?.preset || '[]');

  if (!preset.length) {
    logger.warn({
      msg: 'Пресет пользователя пуст',
      userId: currentUser.id,
      username: currentUser.name,
      chatId,
      chatInternalId: chatInternalId.id,
      function: 'hearsPresetMR',
    });
    try {
      await ctx.reply('Создайте пресет');
    } catch (err) {
      logger.error({
        msg: 'Не удалось отправить сообщение о пустом пресете',
        chatId,
        error: err instanceof Error ? err.message : err,
        function: 'hearsPresetMR',
      });
    }
    return;
  }

  const usersTags = preset
    .map((name: string) => name)
    .filter((el: string) => el !== undefined && el !== authorMR)
    .join(' ');

  if (!chatInternalId.tokenGitLab) {
    logger.warn({
      msg: 'Токен GitLab не настроен для чата',
      chatId,
      chatInternalId: chatInternalId.id,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      function: 'hearsPresetMR',
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
        function: 'hearsPresetMR',
      });
    }
    return;
  }

  const MR = await fetchMR(ctx, chatInternalId.tokenGitLab);

  if (!MR) {
    logger.warn({
      msg: 'MR не получен',
      chatId,
      chatInternalId: chatInternalId.id,
      userId: currentUser.id,
      function: 'hearsPresetMR',
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
      function: 'hearsPresetMR',
    });
  } catch (err) {
    logger.error({
      msg: 'Не удалось удалить сообщение пользователя',
      chatId,
      messageId: ctx.message!.message_id,
      error: err instanceof Error ? err.message : err,
      function: 'hearsPresetMR',
    });
  }

  if (taskNumber !== 'UNKNOWN') {
    logger.info({
      msg: 'Запись выполненной задачи',
      taskNumber,
      chatId,
      chatInternalId: chatInternalId.id,
      userId: currentUser.id,
      function: 'hearsPresetMR',
    });
    recordCompletedTask({
      taskNumber,
      completedTasks: JSON.parse(currentChatMember?.completedTasks ?? '[]'),
      chatInternalId: chatInternalId.id,
      userInternalId: currentUser.id as number,
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
      presetUsersCount: preset.length,
      function: 'hearsPresetMR',
    });
  } catch (err) {
    logger.error({
      msg: 'Не удалось отправить сообщение MR',
      chatId,
      taskNumber,
      error: err instanceof Error ? err.message : err,
      function: 'hearsPresetMR',
    });
  }
};
