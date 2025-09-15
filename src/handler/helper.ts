import { Context } from 'grammy';

import { ApiGitLab } from '../api/apiGitLab';
import { regexBranchId, regexMRId } from './constant';

export const fetchMR = async (ctx: Context) => {
  const text = ctx.message!.text!;
  const idMR = text.match(regexMRId)![1];
  const MR = await ApiGitLab.getMR(idMR);

  if (!MR) return;

  const nameBranch = MR.source_branch;
  const taskNumber = nameBranch.match(regexBranchId)![0];

  return {
    nameBranch,
    taskNumber,
    MR,
  };
};
