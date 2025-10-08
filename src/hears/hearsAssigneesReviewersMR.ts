import { ApiGitLab } from '../api/apiGitLab';
import { IUser } from '../db/db';
import { findUsersByIdGitlab } from '../db/helpers';
import { MyContext } from '../type';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';

const msgSuccessText = (t: string) => `✅  ${t} был добавлен в Git Lab`;
const msgWarningText = (t: string) => `⚠️  ${t} не был добавлен в Git Lab`;

export const hearsAssigneesReviewersMR = async (ctx: MyContext) => {
  try {
    const text = ctx.message!.text!;

    const idMR = text.match(REGEX_MR_ID)![1];

    const MR = await ApiGitLab.getMR(idMR);
    if (!MR) return;

    const idAssignees = MR.assignees[0]?.id ?? 0;
    const idReviewers = MR.reviewers[0]?.id ?? 0;
    const users: IUser[] = await findUsersByIdGitlab([
      idAssignees,
      idReviewers,
    ]);

    const formattedUsers = users.map((u) => u.name).join('');

    if (!formattedUsers.length) {
      await ctx.reply(
        `В базе нет id этих пачанов, Assignees - ${MR.assignees[0].name}, Reviewers - ${MR.reviewers[0].name} `,
        // @ts-ignore
        { disable_web_page_preview: true }
      );
      return;
    }

    const nameBranch = MR.source_branch;
    const taskNumber = nameBranch.match(REGEX_BRANCH_ID)![0];

    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

    const isError = !idAssignees || !idReviewers;

    const linkMR = ctx.message!.text?.slice(1);
    const title = MR.title ? `Заголовок: ${MR.title.slice(0, 50)}` : '';
    const description = MR.description
      ? `Описание: ${
          MR.description.length > 500
            ? `${MR.description.slice(0, 500)}...`
            : MR.description
        }`
      : '';

    const errorMsg = `
      ${
        !idAssignees ? msgWarningText('Assignees') : msgSuccessText('Assignees')
      }
      ${
        !idReviewers ? msgWarningText('Reviewers') : msgSuccessText('Reviewers')
      }
      ${formattedUsers.length ? '' : 'Пользовтель не найдет с таким id Git lab'}
      `;

    const successMsg = `МР от ${MR.author.name} @${ctx.message!.from!.username}

${linkMR}

Задача:
https://itpm.mos.ru/browse/${taskNumber}

${title}

${description} 

${formattedUsers}
    `;

    await ctx.reply(isError ? errorMsg : successMsg, {
      disable_web_page_preview: true,
      parse_mode: 'MarkdownV2',
    } as any);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
