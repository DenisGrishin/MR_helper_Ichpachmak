import { findUsersByName } from '../db/helpers';
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

    const preset = JSON.parse(dataAuthorMR.preset || '[]');

    if (!preset.length) {
      await ctx.reply(
        'У вас ещё нет  пресета.\n\nВы можете создать его через команду /menu → «Обновить пресет»'
      );
      return;
    }
    const MR = await fetchMR(ctx);

    if (!MR) return;

    const taskNumber = getTaskNumber(MR.source_branch);

    const message = messageGenerator({
      ctx,
      MR,
      usersTags: preset,
      taskNumber,
    });

    if (dataAuthorMR && taskNumber) {
      taskService.recordCompletedTask(taskNumber, dataAuthorMR, ctx);
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
