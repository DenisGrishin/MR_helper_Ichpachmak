import { Users } from '../../db';
import { MyContext } from '../../type';

export const showCompletedTasks = async (
  ctx: MyContext,
  chatInternalId: number,
) => {
  const author = `@${ctx?.from?.username}`;

  const currentUser: any = await Users.findByUser(author);

  const users = await Users.findChatMember(currentUser.id, chatInternalId);

  const parseCompletedTasks = Array.from(JSON.parse(users.completedTasks));

  const listCompletedTasks = parseCompletedTasks.join('\n');

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
