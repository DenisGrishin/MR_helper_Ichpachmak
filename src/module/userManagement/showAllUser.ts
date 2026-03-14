import { ChatMembers } from '../../db/chatMembers';
import { TCallbackQueryContext } from '../../type';
import { logger } from '../../config';

export const showAllUser = async (
  ctx: TCallbackQueryContext,
  chatInternalId: number,
) => {
  try {
    ctx.answerCallbackQuery();

    logger.info(`Получение списка пользователей для чата ${chatInternalId}`);

    const usersInCurrentChat: any = await ChatMembers.findChatMembersWithFields(
      chatInternalId,
      ['name'],
      ['isActive'],
    );

    logger.info(`Найдено пользователей в чате: ${usersInCurrentChat.length}`);

    const listUser = usersInCurrentChat
      .map((user: any) => `${user.name} — ${user.isActive ? '✅' : '❌'}\n`)
      .join('');

    await ctx.reply(
      `Список всех пользоватлей:\n${listUser.length ? listUser : 'Спсиок пуст.'}`,
      { reply_parameters: { message_id: ctx.msg!.message_id } },
    );

    logger.info('Список пользователей отправлен пользователю');
  } catch (error) {
    logger.error(
      `Ошибка в showAllUser: ${error instanceof Error ? error.message : error}`,
    );
  }
};
