import { ApiGitLab } from '../../api/apiGitLab';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from '../constant';
import { MyContext } from '../../type';
import { logger } from '../../config';
import { recordCompletedTask } from '../../module/TaskService/recordCompletedTask';

export const fetchMR = async (ctx: MyContext, gitLabToken: string) => {
  const text = ctx.message!.text!;
  const projectPath = encodeGitlabProjectPath(text);
  const idMR = text.match(REGEX_MR_ID)![1];

  if (!gitLabToken) {
    logger.error({
      msg: 'Токен GitLab не найден',
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      message: text,
      function: 'fetchMR',
    });
    throw new Error(`GitLab token not found for chat ${ctx.chat?.id}`);
  }

  try {
    logger.info({
      msg: `Запрос MR от GitLab`,
      mrId: idMR,
      projectPath,
      chatId: ctx.chat?.id,
    });

    const MR = await ApiGitLab.getMR(idMR, projectPath, gitLabToken);
    return MR;
  } catch (error) {
    logger.error({
      msg: 'Ошибка при получении MR',
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

  logger.info(`Получен номер задачи: ${taskNumber}`);
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

const safeJsonParse = <T = any>(
  jsonString: string | null | undefined,
  defaultValue: T,
): T => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn({
      msg: 'Ошибка парсинга JSON',
      error: error instanceof Error ? error.message : error,
      jsonString,
      function: 'safeJsonParse',
    });
    return defaultValue;
  }
};

export const recordTaskForAuthor = async ({
  taskNumber,
  id,
  completedTasks,
  chatInternalId,
  chatId,
  authorUsername,
}: {
  taskNumber: string;
  id: number;
  completedTasks: string;
  chatInternalId: number;
  chatId: number;
  authorUsername: string;
}) => {
  if (id) {
    logger.info({
      msg: 'Запись выполненной задачи',
      taskNumber,
      chatId,
      chatInternalId,
      userId: id,
      username: authorUsername,
      function: 'recordTaskForAuthor',
    });
    recordCompletedTask({
      taskNumber,
      completedTasks: safeJsonParse<string[]>(completedTasks, []),
      chatInternalId,
      userInternalId: id as number,
    });
  } else {
    logger.warn({
      msg: 'Автор MR не найден в списке пользователей чата',
      taskNumber,
      chatId,
      chatInternalId,
      username: authorUsername,
      function: 'recordTaskForAuthor',
    });
  }
};
