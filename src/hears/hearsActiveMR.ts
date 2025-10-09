import { IUser } from '../db/db';
import { getAllUsers } from '../db/helpers';
import { MyContext } from '../type';
import {
  fetchMR,
  getTaskNumber,
  messageGenerator,
  taskService,
} from './helper';

export const hearsActiveMR = async (ctx: MyContext) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи

  const users: IUser[] = await getAllUsers();

  const authorMR = `@${ctx?.from?.username}`;

  const dataAuthorMR = users.find((user) => user.name === authorMR);

  const formattedUsers = users
    .map((u) => (u.isActive ? u.name : undefined))
    .filter((el) => el !== undefined && el !== authorMR)
    .join(' ');

  const MR = await fetchMR(ctx);

  if (!MR) return;

  const taskNumber = getTaskNumber(MR);

  const message = messageGenerator({
    ctx,
    MR,
    usersTags: formattedUsers,
    taskNumber,
    valueSliceLinkMR: 2,
  });

  await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

  if (dataAuthorMR && taskNumber) {
    taskService.recordTask(taskNumber, dataAuthorMR, ctx);
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
