import { ChatMembers } from '../../db/chatMembers';
import { TCallbackQueryContext } from '../../type';

export const showAllUser = async (
  ctx: TCallbackQueryContext,
  chatInternalId: number,
) => {
  ctx.answerCallbackQuery();
  const usersInCurrentChat: any = await ChatMembers.findChatMembersWithFields(
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
