import { Users } from '../../db';
import { TCallbackQueryContext } from '../../type';

export const showAllUser = async (
  ctx: TCallbackQueryContext,
  chatInternalId: number,
) => {
  ctx.answerCallbackQuery();
  const usersInCurrentChat: any = await Users.findUsersByChatId(
    chatInternalId,
    ['name'],
    ['isActive'],
  );

  const listUser = usersInCurrentChat
    .map((user: any) => `${user.name} — ${user.isActive ? '✅' : '❌'}\n`)
    .join('');

  await ctx.reply(
    `Список всех пользоватлей:\n${listUser.length ? listUser : 'Спсиок пуст.'}`,
    { reply_parameters: { message_id: ctx.msg!.message_id } },
  );
};
