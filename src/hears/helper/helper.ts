import { Context } from 'grammy';

import { ApiGitLab } from '../../api/apiGitLab';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from '../constant';
import { MyContext } from '../../type';

export const fetchMR = async (ctx: Context) => {
  const text = ctx.message!.text!;
  const idMR = text.match(REGEX_MR_ID)![1];
  const MR = await ApiGitLab.getMR(idMR);

  return MR;
};

export const getTaskNumber = (MR: any) => {
  const nameBranch = MR.source_branch;

  const matchTask = nameBranch.match(REGEX_BRANCH_ID);
  const taskNumber = matchTask?.[0] ?? 'UNKNOWN';

  return taskNumber;
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

  const description = MR.description
    ? `<b>Описание:</b>\n ${
        MR.description.length > 500
          ? MR.description.slice(0, 500).trim() + '...'
          : MR.description
      }\n\n`
    : '';

  const message = `МР от ${MR.author.name} @${
    ctx.message!.from!.username
  }\n\n${linkMR}${
    taskNumber !== 'UNKNOWN' ? `${taskLink}` : ''
  }${title}${description}${usersTags}   
    `;

  return message;
};
