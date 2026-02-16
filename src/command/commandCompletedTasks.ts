import { findUsersByName } from '../db/helpers';
import { MyContext } from '../type';
import { CompletedTask } from '../hears';
import { Users } from '../db';

export const commandCompletedTasks = async (
  ctx: MyContext,
  chatInternalId: number,
) => {
  const author = `@${ctx?.from?.username}`;

  const currentUser = await Users.findByUser(author);

  const users = await Users.findChatMember(currentUser.id, chatInternalId);

  const parseCompletedTasks = JSON.parse(users.completedTasks);

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
    },
  );
};
