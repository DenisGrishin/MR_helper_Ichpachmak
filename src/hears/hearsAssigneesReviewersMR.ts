import { IUser } from '../db';
import { findUsersByIdGitlab, findUsersByName } from '../db/helpers';
import { MyContext } from '../type';
import {
  fetchMR,
  getTaskNumber,
  messageGenerator,
  taskService,
} from './helper';

const msgSuccessText = (t: string) => `✅  ${t} был добавлен в Git Lab`;
const msgWarningText = (t: string) => `⚠️  ${t} не был добавлен в Git Lab`;

export const hearsAssigneesReviewersMR = async (ctx: MyContext) => {
  const authorMR = `@${ctx?.from?.username}`;
  const [dataAuthorMR] = await findUsersByName([authorMR]);

  try {
    const MR = await fetchMR(ctx);

    if (!MR) return;

    const taskNumber = getTaskNumber(MR.source_branch);

    if (dataAuthorMR && taskNumber) {
      taskService.recordCompletedTask(taskNumber, dataAuthorMR, ctx);
    }
    // ====
    const idAssignees = MR.assignees[0]?.id ?? 0;
    const idReviewers = MR.reviewers[0]?.id ?? 0;
    const users: IUser[] = await findUsersByIdGitlab([
      idAssignees,
      idReviewers,
    ]);

    const formattedUsers = users.map((u) => u.name).join(' ');

    const successMessage = messageGenerator({
      ctx,
      MR,
      usersTags: formattedUsers,
      taskNumber,
    });

    if (!formattedUsers.length) {
      await ctx.reply(
        `В базе нет id этих пачанов, Assignees - ${MR.assignees[0].name}, Reviewers - ${MR.reviewers[0].name} `
      );
      return;
    }

    await ctx.api.deleteMessage(ctx.chat!.id, ctx.message!.message_id);

    const isError = !idAssignees || !idReviewers;

    const errorMsg = `
      ${
        !idAssignees ? msgWarningText('Assignees') : msgSuccessText('Assignees')
      }
      ${
        !idReviewers ? msgWarningText('Reviewers') : msgSuccessText('Reviewers')
      }
      ${formattedUsers.length ? '' : 'Пользовтель не найдет с таким id Git lab'}
      `;

    await ctx.reply(isError ? errorMsg : successMessage, {
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    } as any);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
};
