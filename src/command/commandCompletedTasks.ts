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
    .join('\n');
  await ctx.reply(
    'Список выполненных задач:\n' +
      `<pre><code>${
        parseCompletedTasks.length ? listCompletedTasks : 'Список пуст.'
      }</code></pre>`,
    {
      reply_parameters: { message_id: ctx.msg!.message_id },
      parse_mode: 'HTML',
    }
  );
};
