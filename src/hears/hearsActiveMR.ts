import { ChatСonfig } from '../db';
import { ChatMembers } from '../db/chatMembers';
import { recordCompletedTask } from '../module/TaskService/recordCompletedTask';

import { MyContext } from '../type';
import { fetchMR, getTaskNumber, messageGenerator } from './helper';

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

  if (!gitLabTokens[chatId]) {
    ctx.reply('Добавьте токен для GitLab');
    throw new Error('Нет токена для GitLab');
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

  if (taskNumber !== 'UNKNOWN') {
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
      parse_mode: 'HTML',
    } as any);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
