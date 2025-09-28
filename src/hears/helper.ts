import { Context } from 'grammy';

import { ApiGitLab } from '../api/apiGitLab';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';

export const fetchMR = async (ctx: Context) => {
  const text = ctx.message!.text!;
  const idMR = text.match(REGEX_MR_ID)![1];
  const MR = await ApiGitLab.getMR(idMR);

  if (!MR) return;

  const nameBranch = MR.source_branch;
  const taskNumber = nameBranch.match(REGEX_BRANCH_ID)![0];

  return {
    nameBranch,
    taskNumber,
    MR,
  };
};
