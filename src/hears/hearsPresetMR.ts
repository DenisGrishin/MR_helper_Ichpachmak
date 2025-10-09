import { ApiGitLab } from '../api/apiGitLab';
import { findUsersByName } from '../db/helpers';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';
import { MyContext } from '../type';
import {
  fetchMR,
  getTaskNumber,
  messageGenerator,
  taskService,
} from './helper';

export const hearsPresetMR = async (ctx: MyContext) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи
  try {
    const [dataAuthorMR] = await findUsersByName([
      `@${ctx.message!.from!.username}`,
    ]);

    const MR = await fetchMR(ctx);

    if (!MR) return;

    const taskNumber = getTaskNumber(MR);

    const message = messageGenerator({
      ctx,
      MR,
      usersTags: JSON.parse(dataAuthorMR.preset || '[]'),
      taskNumber,
    });

    if (dataAuthorMR && taskNumber) {
      taskService.recordTask(taskNumber, dataAuthorMR, ctx);
    }

    // TODO тут может падать при удалние сообещния
    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

    // @ts-ignore
    await ctx.reply(message, {
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    } as any);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
