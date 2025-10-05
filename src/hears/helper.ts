import { Context } from 'grammy';

import { ApiGitLab } from '../api/apiGitLab';
import { REGEX_BRANCH_ID, REGEX_MR_ID } from './constant';
import { MyContext } from '../type';
import { IUser, User } from '../db/db';
import { CompletedTask } from './type';

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
const validateRepeatCompletedTasks = ({
  completedTasks,
  taskNumber,
}: {
  completedTasks: CompletedTask[];
  taskNumber: string;
}) => {
  return completedTasks.some((task) => task.taskNumber === taskNumber);
};

const createTimeToCheck = (ctx: MyContext) => {
  const currentDate = Math.floor(Date.now() / 1000);
  ctx.session.timeToCheck = currentDate;
  return currentDate;
};

const hasDayChanged = ({
  dateMsg,
  timeToCheck,
}: {
  dateMsg?: number;
  timeToCheck?: number;
}) => {
  if (!dateMsg || !timeToCheck) return false;

  const parseCurrentDate = new Date(dateMsg * 1000);
  const parseTimeToCheck = new Date(timeToCheck * 1000);

  const isNewDay =
    parseCurrentDate.getDate() !== parseTimeToCheck.getDate() &&
    parseCurrentDate.getMonth() !== parseTimeToCheck.getMonth();

  if (isNewDay) return true;
  return false;
};

const getOneCompletedTask = (
  allCompletedTasks: { completedTasks: string }[]
): CompletedTask => {
  let completedTask = null;

  for (let index = 0; index < allCompletedTasks.length; index++) {
    const element = allCompletedTasks[index];
    const tasks = JSON.parse(element.completedTasks);

    if (tasks.length) {
      completedTask = tasks;
      break;
    }
  }

  return completedTask;
};

export const recordTask = async (
  taskNumber: string,
  authorMR: IUser,
  ctx: MyContext
) => {
  let timeToCheck = ctx.session.timeToCheck;
  const completedTasks = JSON.parse(authorMR.completedTasks);

  // todo учесть часовой пояс
  // этот код отвечает если вермя для проверки
  if (!timeToCheck) {
    const allCompletedTasks = await User.getCompletedTasks();
    const oneCompletedTask = getOneCompletedTask(allCompletedTasks);

    if (!oneCompletedTask) {
      timeToCheck = createTimeToCheck(ctx);
    } else {
      timeToCheck = oneCompletedTask.dateTask;
      ctx.session.timeToCheck = timeToCheck;
    }
  }

  const isRepeatCompletedTask = validateRepeatCompletedTasks({
    completedTasks,
    taskNumber,
  });

  const isNewDay = hasDayChanged({ dateMsg: ctx.msg?.date, timeToCheck });

  if (isNewDay) {
    User.deleteAllCompletedTasks(() => {});
    createTimeToCheck(ctx);
  }

  if (isRepeatCompletedTask) {
    console.log('Такой номер задчи уже есть ' + taskNumber);
    return;
  }

  try {
    if (!taskNumber) throw new Error('Нет номара задачи');

    const updateCompletedTasks = JSON.stringify([
      ...completedTasks,
      { taskNumber, dateTask: ctx.message?.date },
    ]);

    // TODO тут дописать третий аругемент
    User.updateCompletedTasks(authorMR.id, updateCompletedTasks, () => {});
  } catch (error) {
    console.error(error);
  }
};

// const isNewDay = ({
//   currentTimestamp,
//   previousTimestamp,
// }: {
//   currentTimestamp?: number;
//   previousTimestamp?: number;
// }): boolean => {
//   if (currentTimestamp === undefined || previousTimestamp === undefined) {
//     return false;
//   }

//   // Приводим к миллисекундам (если временные метки в секундах)
//   const currentMs = currentTimestamp * 1000;
//   const previousMs = previousTimestamp * 1000;

//   // Количество миллисекунд в одном дне
//   const msPerDay = 24 * 60 * 60 * 1000;

//   // Вычисляем количество дней с 1 января 1970 года
//   const currentDays = Math.floor(currentMs / msPerDay);
//   const previousDays = Math.floor(previousMs / msPerDay);

//   // Если дни разные — новый день
//   return currentDays !== previousDays;
// };
