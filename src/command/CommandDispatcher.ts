import { ITasksUsers, Users } from '../db';
import { getNamesBd, findUsersByName } from '../db/helpers';
import type { Context } from 'grammy';
import { getTaskNumber } from '../hears/helper';

const TEXT_MSG_1 = 'Эти(-от) пользователи(-ль)';
const TEXT_MSG_2 =
  'Обновил тест-площадку, проверьте свои задачи и переведите в "готово к тестированию" + поменяйте исполнителя задачи на QA, если все ок';
interface IMessageBotArgs {
  messageId: number;
  successValue: string[];
  warningValue?: string[];
  ctx: Context;
  textSuccess?: string;
  textWarning?: string;
}

export class CommandDispatcher {
  async setUser(ctx: Context): Promise<void> {
    const msgUserNames = ctx.message?.text?.match(/@\w+/g);

    if (!msgUserNames) {
      this.showErrorMsg('Отправьте теги кого хотите добавить в базу.', ctx);
      return;
    }

    const { notFindUsersDb, usersNameBd } = await getNamesBd(msgUserNames);

    Users.create(notFindUsersDb, 'tasksUsers', (err) => {
      if (err) return;
    });

    Users.create(notFindUsersDb, 'users', (err) => {
      if (err) return;
    });

    await this.replyMessageBot({
      messageId: ctx.msg!.message_id,
      successValue: notFindUsersDb,
      warningValue: usersNameBd,
      textSuccess: `${TEXT_MSG_1} были добавлены в базу`,
      textWarning: `${TEXT_MSG_1} уже существуют в базе`,
      ctx,
    });
  }

  async setIdGitLab(ctx: Context) {
    const msg = ctx.message!.text!;
    const msgGitId = Number(msg.split(' ').filter((el) => !!el)[1]);
    const tags = msg.match(/@\w+/g);

    if (!tags) {
      await this.showErrorMsg('Вы не передали тег', ctx);
      return;
    }

    if (isNaN(msgGitId)) {
      await this.showErrorMsg('Некорректный GitLab ID', ctx);
      return;
    }

    const users = await findUsersByName(tags);

    if (!users.length) {
      await this.showErrorMsg(`Таких пользователей нет в базе ${tags}`, ctx);
      return;
    }

    const { id } = users[0];

    Users.updateGitLabId(id, Number(msgGitId), (err) => {
      if (err) console.error(err);
    });

    await this.replyMessageBot({
      messageId: ctx.msg!.message_id,
      successValue: tags,
      textSuccess: `Этому пользователю был добавлен id Git lab: ${msgGitId} тег`,
      ctx,
    });
  }

  async showErrorMsg(msgError: string, ctx: Context): Promise<void> {
    await ctx.reply(`⚠️ ${msgError}`, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });
  }

  async replyMessageBot({
    messageId,
    successValue,
    warningValue,
    ctx,
    textSuccess = '',
    textWarning = '',
  }: IMessageBotArgs): Promise<void> {
    const isWarning = !!warningValue?.length;
    const isSuccess = !!successValue.length;

    const messageSuccessNameDb = isSuccess
      ? `✅ ${textSuccess}: ${successValue.join(', ')}`
      : '';

    const messageWarningNameDb = isWarning
      ? `⚠️ ${textWarning}: ${warningValue?.join(', ')}`
      : '';

    await ctx.reply(`${messageSuccessNameDb}\n\n${messageWarningNameDb}`, {
      reply_parameters: { message_id: messageId },
    });
  }

  async createTasksList(ctx: Context) {
    const msgListTasks = ctx.message?.text?.split('\n');
    const allTasks = await Users.all('tasksUsers');
    const objFiltreListTask: Record<string, string[]> = {};

    const msgTasksList = allTasks?.reduce((acc, curr: ITasksUsers) => {
      const listCompletedTasks = JSON.parse(curr.completedTasks);

      if (!listCompletedTasks.length) {
        return acc + '';
      }

      const filterList = listCompletedTasks.filter((el: string) =>
        msgListTasks?.includes(el)
      );

      const createListLinkTask = filterList.map(
        (el: string) => `https://itpm.mos.ru/browse/${getTaskNumber(el)}`
      );

      const string = `${curr.name}\n${createListLinkTask.join('\n')}
      `;

      if (!createListLinkTask.length) {
        return acc + '';
      }

      objFiltreListTask[curr.name] = filterList;

      return acc + '\n' + string;
    }, '');

    await ctx.reply(TEXT_MSG_2 + '\n' + msgTasksList, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });

    const updateTask = Object.entries(objFiltreListTask).reduce(
      (acc, [key, value]) => {
        const user = allTasks.find((el) => el.name === key);

        if (user) {
          const listCompletedTasks = JSON.parse(user.completedTasks);

          const updateListTask = listCompletedTasks.filter(
            (task: string) => !value?.includes(task)
          );

          acc.push({
            id: user.id,
            name: key,
            completedTasks: JSON.stringify(updateListTask),
          });
        }
        return acc;
      },
      [] as Array<{ id: number; name: string; completedTasks: string }>
    );

    updateTask.forEach((el) => {
      Users.updateMultipleTasksUsers(el.completedTasks, el.id, () => {});
    });
  }
}
