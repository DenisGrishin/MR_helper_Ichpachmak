import { Context } from 'grammy';
import { ApiGitLab } from '../api/apiGitLab';
import { findUser } from '../db/helpers';
import { regexBranchId, regexMRId } from './constant';

export const handlerPresetMR = async (ctx: Context) => {
  try {
    const authorMsg = await findUser(`@${ctx.message!.from!.username}`);

    const text = ctx.message!.text!;
    const idMR = text.match(regexMRId)![1];
    const MR = await ApiGitLab.getMR(idMR);
    if (!MR) return;
    const nameBranch = MR.source_branch;
    const taskNumber = nameBranch.match(regexBranchId)![0];

    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

    const linkMR = ctx.message!.text?.slice(1);
    const title = MR.title ? `Заголовок: ${MR.title.slice(0, 50)}` : '';
    const description = MR.description
      ? `Описание: ${MR.description.slice(0, 300)}`
      : '';

    const successMsg = `МР от ${MR.author.name} @${ctx.message!.from!.username}

${linkMR}

Задача:
https://itpm.mos.ru/browse/${taskNumber}

${title}

${description} 

${JSON.parse(authorMsg?.preset || '[]').join(', ')}
    `;
    // @ts-ignore
    await ctx.reply(successMsg, { disable_web_page_preview: true });
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
