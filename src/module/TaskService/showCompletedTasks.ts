import { Users } from '../../db';
import { ChatMembers } from '../../db/chatMembers';
import { MyContext } from '../../type';

export const showCompletedTasks = async (
  ctx: MyContext,
  chatInternalId: number,
) => {
  const author = `@${ctx?.from?.username}`;

  const currentUser: any = await Users.findUser(
    author,
    'name',
    (err, users) => {
      if (err) {
        console.error(err);
      } else if (users && users.length > 0) {
        console.log('Пользователь найден:', users[0]);
      } else {
        console.log('Пользователь с таким id не найден');
      }
    },
  );

  const user = await ChatMembers.findChatMember(
    currentUser.id,
    chatInternalId,
    ['completedTasks'],
  );

  if (!user) {
    ctx.reply(`${author} такого пользователя еще нет.`);
    return;
  }

  const parseCompletedTasks = Array.from(JSON.parse(user.completedTasks ?? ''));

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
