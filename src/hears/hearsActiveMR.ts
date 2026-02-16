import { ChatСonfig } from '../db';
import { IUser, Users } from '../db/users';

import { MyContext } from '../type';
import {
  fetchMR,
  getTaskNumber,
  messageGenerator,
  taskService,
} from './helper';

// TODO вынести отдельно чтоб при старте сохрнять ативных пользватлей
export const hearsActiveMR = async (
  ctx: MyContext,
  gitLabTokens: Record<string, string | null>,
) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи

  const chatId = ctx.chat?.id;

  if (!chatId) {
    throw new Error('chatId отсутствует в сессии');
  }

  const chatInternalId = await ChatСonfig.findByTelegramId(chatId);

  const usersInCurrentChat = await Users.findUsersByChatId(
    chatInternalId.id,
    ['name'],
    ['isActive', 'completedTasks'],
  );

  const authorMR = `@${ctx?.from?.username}`;

  const usersTags = usersInCurrentChat
    .map((u) => u.name)
    .filter((el) => el !== undefined && el !== authorMR)
    .join(' ');

  const MR = await fetchMR(ctx, gitLabTokens);

  if (!MR) return;

  const taskNumber = getTaskNumber(MR.source_branch);

  const message = messageGenerator({
    ctx,
    MR,
    usersTags,
    taskNumber,
    valueSliceLinkMR: 2,
  });

  await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

  console.log(
    'usersInCurrentChat?.completedTasks ==> ',
    usersInCurrentChat?.completedTasks,
  );
  if (taskNumber && usersInCurrentChat?.completedTasks) {
    taskService.recordCompletedTask({
      taskNumber,
      completedTasks: JSON.parse(usersInCurrentChat?.completedTasks),
      ctx,
    });
    // await taskService.recordTask(
    //   taskNumber === 'UNKNOWN' ? 'UNKNOWN' : MR.source_branch,
    //   dataAuthorMR.id,
    // );
  }

  try {
    // @ts-ignore
    await ctx.reply(message, {
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    } as any);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
