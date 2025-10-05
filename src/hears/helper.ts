import { Context } from 'grammy';

import { ApiGitLab } from '../api/apiGitLab';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';
import { MyContext } from '../type';
import { User } from '../db/db';

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

// console.log('date ==> ', date.toISOString());
// console.log('date ==> ', date.toLocaleString('ru-RU'));

let oldDate: Date | null = null;

const verifyNewDaY = (dateMsg: number) => {
  const currentDate = new Date(dateMsg * 1000);

  if (!oldDate) {
    oldDate = new Date(dateMsg * 1000);
  }

  const isNewDay =
    oldDate &&
    currentDate.getDate() === oldDate.getDate() &&
    currentDate.getMonth() === oldDate.getMonth();

  if (isNewDay) return true;
  return false;
};

const createTimeToCheck = (ctx: MyContext) => {
  const currentDate = Math.floor(Date.now() / 1000);
  ctx.session.timeToCheck = currentDate;
  return currentDate;
};

const validateOneCompletedTasks = (
  completedTasks: { completedTasks: string }[]
) => {
  let tasksFind;

  for (let index = 0; index < completedTasks.length; index++) {
    const element = completedTasks[index];
    const tasks = JSON.parse(element.completedTasks);

    if (tasks.length) {
      tasksFind = tasks;
      break;
    }
  }
  console.log(tasksFind);
};
// Time to check
export const recordTask = async (
  taskNumber: string,
  authorMR: string,
  ctx: MyContext
) => {
  if (!ctx.message?.date) return;

  const completedTasks = await User.getCompletedTasks();
  console.log('completedTasks ==> ', completedTasks);

  const isNewDay = verifyNewDaY(ctx.message?.date);
};
