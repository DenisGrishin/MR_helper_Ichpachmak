import { ChatСonfig, Users } from '../db';
import { ChatMembers } from '../db/chatMembers';
import { recordCompletedTask } from '../module/TaskService/recordCompletedTask';
import { MyContext } from '../type';
import { getTaskNumber, messageGenerator } from './helper';
import { fetchMR } from './helper/helper';

export const hearsPresetMR = async (
  ctx: MyContext,
  gitLabTokens: Record<string, string | null>,
) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи

  const chatId = ctx.chat?.id;

  if (!chatId) {
    throw new Error('chatId отсутствует');
  }

  if (!gitLabTokens[chatId]) {
    ctx.reply('Добавьте токен для GitLab');
    throw new Error('Нет токена для GitLab');
  }

  const chatInternalId = await ChatСonfig.findByTelegramId(chatId);

  const authorMR = `@${ctx?.from?.username}`;

  const currentUser: any = await Users.findUser(
    authorMR,
    'name',
    (err, users) => {
      if (err) {
        console.error(err);
      } else if (users && users.length > 0) {
        console.log('Пользователь найден:', users[0]);
      } else {
        console.log('Пользователь с таким id не найден');
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
    ctx.reply('Создайте пресет');
    return;
  }

  const usersTags = preset
    .map((name: string) => name)
    .filter((el: string) => el !== undefined && el !== authorMR)
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
      completedTasks: JSON.parse(currentChatMember?.completedTasks ?? '[]'),
      chatInternalId: chatInternalId.id,
      userInternalId: currentUser.id as number,
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
