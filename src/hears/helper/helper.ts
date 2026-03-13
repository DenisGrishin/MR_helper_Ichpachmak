import { ApiGitLab } from '../../api/apiGitLab';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from '../constant';
import { MyContext } from '../../type';
import { Logger } from '../../utils/logger';

export const fetchMR = async (ctx: MyContext, gitLabToken: string) => {
  const text = ctx.message!.text!;
  const projectPath = encodeGitlabProjectPath(text);
  const idMR = text.match(REGEX_MR_ID)![1];

  if (!gitLabToken) {
    Logger.error('Токен GitLab не найден', {
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      message: text,
      function: 'fetchMR',
    });
    throw new Error(`GitLab token not found for chat ${ctx.chat?.id}`);
  }

  try {
    Logger.info(`Запрос MR от GitLab`, {
      mrId: idMR,
      projectPath,
      chatId: ctx.chat?.id,
    });

    const MR = await ApiGitLab.getMR(idMR, projectPath, gitLabToken);
    return MR;
  } catch (error) {
    Logger.error('Ошибка при получении MR', {
      error: error instanceof Error ? error.message : error,
      mrId: idMR,
      projectPath,
      chatId: ctx.chat?.id,
    });

    await ctx.reply(`❌ Не удалось получить MR: ${error}`);
    return null;
  }
};

export const getTaskNumber = (nameBranch: string) => {
  const matchTask = nameBranch.match(REGEX_BRANCH_ID);
  const taskNumber = matchTask?.[0] ?? 'UNKNOWN';

  return taskNumber;
};

const encodeGitlabProjectPath = (text: string) => {
  const url = new URL(
    `${text.split(`${process.env.BASE_URL}`).slice(1)}`,
    `https://${process.env.BASE_URL}`,
  );

  return url.pathname.split('/-/')[0].slice(1).split('/').join('%2F');
};

export const messageGenerator = ({
  MR,
  ctx,
  usersTags,
  taskNumber,
  valueSliceLinkMR = 1,
}: {
  MR: any;
  ctx: MyContext;
  usersTags: string;
  taskNumber: string;
  valueSliceLinkMR?: number;
}) => {
  const taskLink = `Задача: https://itpm.mos.ru/browse/${taskNumber}\n\n`;
  const linkMR = `МР: ${ctx.message!.text?.slice(valueSliceLinkMR)}\n\n`;
  const title = MR.title ? `Заголовок: ${MR.title}\n\n` : '';

  const description = MR.description
    ? `Описание:\n ${
        MR.description.length > 500
          ? MR.description.slice(0, 500).trim() + '...'
          : MR.description
      }\n\n`
    : '';

  const assigneeText = MR?.assignees[0]?.name
    ? `Assignee: ${MR.assignees[0].name}\n`
    : '';

  const header = `МР от ${MR.author.name}\nОтправил: @${ctx.message!.from!.username}\n${assigneeText}Проект: ${MR.references.full}\n`;

  const message = `${header}${linkMR}${
    taskNumber !== 'UNKNOWN' ? `${taskLink}` : ''
  }${title}${description}${usersTags}   
    `;

  return message;
};
