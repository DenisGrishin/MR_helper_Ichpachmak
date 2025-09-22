import { ApiGitLab } from '../api/apiGitLab';
import { IUser } from '../db/db';
import { getAllUsers } from '../db/helpers';
import { MyContext } from '../type';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';

function removeNewLines(text: string): string {
  return text.replace(/\n/g, '');
}

export const handlerActiveMR = async (ctx: MyContext) => {
  // TODO сделать обработку на ошибку если нет мр или проблема с апи
  try {
    const users: IUser[] = await getAllUsers();

    const formattedUsers = users
      .map((u) => (u.isActive ? `${u.name} ` : undefined))
      .filter((el): el is string => el !== undefined)
      .join('');

    const text = ctx.message!.text!;
    const idMR = text.match(REGEX_MR_ID)![1];
    const MR = await ApiGitLab.getMR(idMR);
    if (!MR) return;
    const nameBranch = MR.source_branch;
    const taskNumber = nameBranch.match(REGEX_BRANCH_ID)![0];

    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

    const linkMR = ctx.message!.text?.slice(2);
    const title = MR.title ? `Заголовок: ${MR.title.slice(0, 50)}` : '';
    const description = MR.description
      ? `Описание: ${removeNewLines(MR.description.slice(0, 300))}`
      : '';

    const msg = `МР от ${MR.author.name} @${ctx.message!.from!.username} 

${linkMR}

Задача:
https://itpm.mos.ru/browse/${taskNumber}

${title}

${description} 

${formattedUsers}    
	 `;
    // @ts-ignore
    await ctx.reply(msg, { disable_web_page_preview: true });
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
