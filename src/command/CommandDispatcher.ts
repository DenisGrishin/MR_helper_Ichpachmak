import { ITasksUsers, Users } from '../db';
import { syncUsersWithDb, findUsersByName } from '../db/helpers';
import type { Context } from 'grammy';
import { getTaskNumber } from '../hears/helper';
import { MyContext } from '../type';

const TEXT_MSG_TEST =
  'Обновил  🟨TEST-площадку, проверьте свои задачи и переведите в "готово к тестированию" + поменяйте исполнителя задачи на QA, если все ок';
const TEXT_MSG_STAGE =
  'Обновил 🟩STAGE-площадку, проверьте свои задачи и переведите в "готово к тестированию" + поменяйте исполнителя задачи на QA, если все ок';

// TODO потом удалить

export class CommandDispatcher {
  async createTasksList(ctx: Context, kontur: 'test' | 'stage') {
    const msgListTasks = ctx.message?.text?.split('\n');
    const allTasks = await Users.all('tasksUsers');
    const objFiltreListTask: Record<string, string[]> = {};

    const msgTasksList = allTasks?.reduce((acc, curr: ITasksUsers) => {
      const listCompletedTasks = JSON.parse(curr.completedTasks);

      if (!listCompletedTasks.length) {
        return acc + '';
      }

      const filterList = listCompletedTasks.filter((el: string) =>
        msgListTasks?.includes(el),
      );

      const createListLinkTask = filterList.map(
        (el: string) => `https://itpm.mos.ru/browse/${getTaskNumber(el)}`,
      );

      const string = `${curr.name}\n${createListLinkTask.join('\n')}
      `;

      if (!createListLinkTask.length) {
        return acc + '';
      }

      objFiltreListTask[curr.name] = filterList;

      return acc + '\n' + string;
    }, '');

    const konturText = kontur === 'test' ? TEXT_MSG_TEST : TEXT_MSG_STAGE;

    await ctx.reply(konturText + '\n' + msgTasksList, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });

    const updateTask = Object.entries(objFiltreListTask).reduce(
      (acc, [key, value]) => {
        const user = allTasks.find((el) => el.name === key);

        if (user) {
          const listCompletedTasks = JSON.parse(user.completedTasks);

          const updateListTask = listCompletedTasks.filter(
            (task: string) => !value?.includes(task),
          );

          acc.push({
            id: user.id,
            name: key,
            completedTasks: JSON.stringify(updateListTask),
          });
        }
        return acc;
      },
      [] as Array<{ id: number; name: string; completedTasks: string }>,
    );

    updateTask.forEach((el) => {
      Users.updateMultipleTasksUsers(el.completedTasks, el.id, () => {});
    });
  }
}
