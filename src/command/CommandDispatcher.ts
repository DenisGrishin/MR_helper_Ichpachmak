import { ITasksUsers, Users } from '../db';
import { syncUsersWithDb, findUsersByName } from '../db/helpers';
import type { Context } from 'grammy';
import { getTaskNumber } from '../hears/helper';
import { MyContext } from '../type';

const TEXT_MSG_1 = 'Эти(-от) пользователи(-ль)';
const TEXT_MSG_TEST =
  'Обновил  🟨TEST-площадку, проверьте свои задачи и переведите в "готово к тестированию" + поменяйте исполнителя задачи на QA, если все ок';
const TEXT_MSG_STAGE =
  'Обновил 🟩STAGE-площадку, проверьте свои задачи и переведите в "готово к тестированию" + поменяйте исполнителя задачи на QA, если все ок';

interface IMessageBotArgs {
  messageId: number;
  successValue: string[];
  usersToUpdate: string[];
  warningValue?: string[];
  ctx: Context;
  textSuccess?: string;
  textWarning?: string;
  textUpdateUser?: string;
}

export class CommandDispatcher {
  async setUser(
    ctx: MyContext,
    chatId: string | null | undefined,
    chatTitle: string,
  ): Promise<void> {
    const msgUserNames = ctx.message?.text?.match(/@\w+/g);

    if (!msgUserNames) {
      this.showErrorMsg('Отправьте теги кого хотите добавить в базу.', ctx);
      return;
    } else if (!chatId) {
      this.showErrorMsg('chatId отсутствует в сессии', ctx);
      throw new Error('chatId отсутствует в сессии');
    }

    const { notFindUsersBd, usersNameBd, usersToUpdate } =
      await syncUsersWithDb(chatId, msgUserNames);

    await this.replyMessageBot({
      messageId: ctx.msg!.message_id,
      successValue: notFindUsersBd || [],
      warningValue: usersNameBd,
      usersToUpdate: usersToUpdate.map((u) => u.name),
      textSuccess: `${TEXT_MSG_1} были добавлены в базу`,
      textWarning: `${TEXT_MSG_1}  уже существуют в базе и добавлены в чат  ${chatTitle}`,
      textUpdateUser: `${TEXT_MSG_1} добавлен(-ны) в новый чат ${chatTitle}`,
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
      textUpdateUser: '',
      usersToUpdate: [],
      warningValue: [],
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
    usersToUpdate,
    warningValue,
    ctx,
    textSuccess = '',
    textWarning = '',
    textUpdateUser = '',
  }: IMessageBotArgs): Promise<void> {
    const isWarning = !!warningValue?.length;
    const isSuccess = !!successValue.length;
    const isUpdate = !!usersToUpdate.length;

    const messageSuccessNameDb = isSuccess
      ? `✅ ${textSuccess}: ${successValue.join(', ')}`
      : '';

    const messageWarningNameDb = isWarning
      ? `⚠️ ${textWarning}: ${warningValue?.join(', ')}`
      : '';

    const messageUsersToUpdateNameDb = isUpdate
      ? `🆙 ${textUpdateUser}: ${usersToUpdate?.join(', ')}`
      : '';

    await ctx.reply(
      `${messageSuccessNameDb}\n\n${messageWarningNameDb}\n\n${messageUsersToUpdateNameDb}`,
      {
        reply_parameters: { message_id: messageId },
      },
    );
  }

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
