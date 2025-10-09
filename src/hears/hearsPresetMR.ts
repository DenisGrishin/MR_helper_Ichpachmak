import { ApiGitLab } from '../api/apiGitLab';
import { findUsersByName } from '../db/helpers';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';
import { MyContext } from '../type';
import { taskService } from './helper';

export const hearsPresetMR = async (ctx: MyContext) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи
  try {
    const [dataAuthorMR] = await findUsersByName([
      `@${ctx.message!.from!.username}`,
    ]);

    // ====
    const text = ctx.message!.text!;
    const idMR = text.match(REGEX_MR_ID)![1];
    const MR = await ApiGitLab.getMR(idMR);

    if (!MR) return;
    const nameBranch = MR.source_branch;

    const matchTask = nameBranch.match(REGEX_BRANCH_ID);
    const taskNumber = matchTask?.[0] ?? 'UNKNOWN';

    if (dataAuthorMR && taskNumber) {
      taskService.recordTask(taskNumber, dataAuthorMR, ctx);
    }
    // ===
    const taskLink = `<b>Задача:</b> https://itpm.mos.ru/browse/${taskNumber}\n\n`;

    // TODO тут может падать при удалние сообещния
    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

    const linkMR = `<b>МР:</b> ${ctx.message!.text?.slice(1)}\n\n`;
    const title = MR.title ? `<b>Заголовок:</b> ${MR.title}\n\n` : '';

    const description = MR.description
      ? `<b>Описание:</b> ${
          MR.description.length > 500
            ? MR.description.slice(0, 500).trim() + '...'
            : MR.description
        }\n\n`
      : '';

    const msg = `МР от ${MR.author.name} @${ctx.message!.from!.username}\n
${linkMR}${
      taskNumber !== 'UNKNOWN' ? `${taskLink}` : ''
    }${title}${description}${JSON.parse(dataAuthorMR.preset || '[]').join(
      ', '
    )}   
   `;
    // @ts-ignore
    await ctx.reply(msg, {
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    } as any);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
