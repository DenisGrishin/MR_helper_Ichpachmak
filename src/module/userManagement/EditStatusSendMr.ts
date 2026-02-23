import { ChatMembers } from '../../db/chatMembers';
import { TCallbackQueryContext } from '../../type';
import { createListUsers } from './helper';

export const handlerEditStatusSendMrUser = async (
  ctx: TCallbackQueryContext,
) => {
  ctx.answerCallbackQuery();
  const userId = Number(ctx.callbackQuery.data.split(':')[1]);
  const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);

  const user = await ChatMembers.findChatMember(userId, chatInternalId, [
    'isActive',
  ]);

  const statusIsActive = !user?.isActive ? 1 : 0;

  ChatMembers.updateField(userId, chatInternalId, {
    isActive: statusIsActive,
  });

  createListUsers(ctx, 'editStatusSendMR', chatInternalId);
};
