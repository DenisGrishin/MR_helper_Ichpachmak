import { ApiGitLab } from '../api/apiGitLab';
import { IUser } from '../db/db';
import { findUsersByIdGitlab, findUsersByName } from '../db/helpers';
import { MyContext } from '../type';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';
import { taskService } from './helper';

const msgSuccessText = (t: string) => `✅  ${t} был добавлен в Git Lab`;
const msgWarningText = (t: string) => `⚠️  ${t} не был добавлен в Git Lab`;

export const hearsAssigneesReviewersMR = async (ctx: MyContext) => {
  const authorMR = `@${ctx?.from?.username}`;
  const [dataAuthorMR] = await findUsersByName([authorMR]);

  try {
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
    // ====
    const idAssignees = MR.assignees[0]?.id ?? 0;
    const idReviewers = MR.reviewers[0]?.id ?? 0;
    const users: IUser[] = await findUsersByIdGitlab([
      idAssignees,
      idReviewers,
    ]);

    const formattedUsers = users.map((u) => u.name).join(' ');

    if (!formattedUsers.length) {
      await ctx.reply(
        `В базе нет id этих пачанов, Assignees - ${MR.assignees[0].name}, Reviewers - ${MR.reviewers[0].name} `,
        // @ts-ignore
        { disable_web_page_preview: true }
      );
      return;
    }

    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

    const isError = !idAssignees || !idReviewers;

    const linkMR = `<b>МР:</b> ${ctx.message!.text?.slice(1)}\n\n`;
    const title = MR.title ? `<b>Заголовок:</b> ${MR.title}\n\n` : '';
    const taskLink = `<b>Задача:</b> https://itpm.mos.ru/browse/${taskNumber}\n\n`;
    const description = MR.description
      ? `<b>Описание:</b> ${
          MR.description.length > 500
            ? MR.description.slice(0, 500).trim() + '...'
            : MR.description
        }\n\n`
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

    const successMsg = `МР от ${MR.author.name} @${
      ctx.message!.from!.username
    }\n
${linkMR}${
      taskNumber !== 'UNKNOWN' ? `${taskLink}` : ''
    }${title}${description}${formattedUsers}   
    `;

    await ctx.reply(isError ? errorMsg : successMsg, {
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    } as any);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
