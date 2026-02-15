import { Users } from '../../db';
import { TCallbackQueryContext } from '../../type';
import { createListUsers } from './helper';

export const handlerEditStatusSendMrUser = async (
  ctx: TCallbackQueryContext,
) => {
  const userId = Number(ctx.callbackQuery.data.split(':')[1]);
  const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);

  const user = await Users.findChatMember(userId, chatInternalId);

  const statusIsActive = !user?.isActive ? 1 : 0;

  Users.updateChatMember(userId, chatInternalId, { isActive: statusIsActive });

  createListUsers(ctx, 'editStatusSendMR', chatInternalId);
  ctx.answerCallbackQuery();
};
