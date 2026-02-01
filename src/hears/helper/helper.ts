import { Context } from 'grammy';

import { ApiGitLab } from '../../api/apiGitLab';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from '../constant';
import { MyContext } from '../../type';

export const fetchMR = async (ctx: MyContext) => {
  const text = ctx.message!.text!;

  const projectPath = encodeGitlabProjectPath(text);

  const idMR = text.match(REGEX_MR_ID)![1];

  const gitLabTokens = ctx.session.gitLabTokens[String(ctx.chat?.id)];

  if (!gitLabTokens) {
    throw new Error('Такого токена от GitLab нет всписке');
  }

  try {
    const MR = await ApiGitLab.getMR(idMR, projectPath, gitLabTokens);
    return MR;
  } catch (error) {
    ctx.reply(`Bot - ${error}`);
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
  const taskLink = `<b>Задача:</b> https://itpm.mos.ru/browse/${taskNumber}\n\n`;
  const linkMR = `<b>МР:</b> ${ctx.message!.text?.slice(valueSliceLinkMR)}\n\n`;
  const title = MR.title ? `<b>Заголовок:</b> ${MR.title}\n\n` : '';
  const referencesFull = MR.references.full.split('!')[0];
  const projectName = referencesFull.split('/').pop();

  const description = MR.description
    ? `<b>Описание:</b>\n ${
        MR.description.length > 500
          ? MR.description.slice(0, 500).trim() + '...'
          : MR.description
      }\n\n`
    : '';

  const assigneeText = MR?.assignees[0]?.name
    ? `<b>Assignee:</b> ${MR.assignees[0].name}\n`
    : '';

  const header = `<b>МР создал:</b> ${MR.author.name}\n<b>Отпраил:</b> @${ctx.message!.from!.username}\n${assigneeText}<b>Проект:</b> ${projectName}\n`;
  console.log('MR ==> ', MR);

  const message = `${header}${linkMR}${
    taskNumber !== 'UNKNOWN' ? `${taskLink}` : ''
  }${title}${description}${usersTags}   
    `;

  return message;
};
