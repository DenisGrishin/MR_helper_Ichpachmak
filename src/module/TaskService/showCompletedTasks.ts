import { Users } from '../../db';
import { ChatMembers } from '../../db/chatMembers';
import { MyContext } from '../../type';
import { logger } from '../../config';

export const showCompletedTasks = async (
  ctx: MyContext,
  chatInternalId: number,
) => {
  try {
    const author = `@${ctx?.from?.username}`;
    logger.info(`Запрос списка выполненных задач от пользователя: ${author}`);

    const currentUser: any = await Users.findUser(
      author,
      'name',
      (err, users) => {
        if (err) {
          logger.error(`Ошибка при поиске пользователя: ${err}`);
        } else if (users && users.length > 0) {
          logger.info(`Пользователь найден: ${users[0].name}`);
        } else {
          logger.warn('Пользователь с таким id не найден');
        }
      },
    );

    const user = await ChatMembers.findChatMember(
      currentUser.id,
      chatInternalId,
      ['completedTasks'],
    );

    if (!user) {
      logger.warn(`Пользователь ${author} не найден в чате ${chatInternalId}`);
      ctx.reply(`${author} такого пользователя еще нет.`);
      return;
    }

    const parseCompletedTasks = Array.from(
      JSON.parse(user.completedTasks ?? ''),
    );

    logger.info(`Найдено выполненных задач: ${parseCompletedTasks.length}`);

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

    logger.info('Список выполненных задач отправлен пользователю');
  } catch (error) {
    logger.error(
      `Ошибка в showCompletedTasks: ${error instanceof Error ? error.message : error}`,
    );
  }
};
