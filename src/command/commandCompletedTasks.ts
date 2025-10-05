import { findUsersByName } from '../db/helpers';
import { MyContext } from '../type';
import { CompletedTask } from '../hears';

export const commandCompletedTasks = async (ctx: MyContext) => {
  const author = `@${ctx?.from?.username}`;
  const users = await findUsersByName([author]);
  const { completedTasks } = users[0];

  const parseCompletedTasks = JSON.parse(completedTasks);

  const listCompletedTasks = parseCompletedTasks
    .map((task: CompletedTask) => {
      return task.taskNumber;
    })
    .join(' ');
  await ctx.reply(
    `Список выполненных задач:\n${
      parseCompletedTasks.length ? listCompletedTasks : 'Спсиок пуст.'
    }`,
    { reply_parameters: { message_id: ctx.msg!.message_id } }
  );
};
