import { Users } from '../../db';
import { TCallbackQueryContext } from '../../type';
import { createListUsers } from './helper';

export const handlerAddUserToChat = async (ctx: TCallbackQueryContext) => {
  const userInternalId = Number(ctx.callbackQuery.data.split(':')[1]);
  const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);

  Users.addUserToChat(userInternalId, chatInternalId);

  createListUsers(ctx, 'addUserToChat', chatInternalId);
  ctx.answerCallbackQuery();
};
