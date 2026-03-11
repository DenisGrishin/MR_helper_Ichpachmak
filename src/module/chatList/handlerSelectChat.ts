import { handleCommand } from '../../command/handleCommand';
import { KeyCommand } from '../../constant/constant';
import { TCallbackQueryContext } from '../../type';
import { actionEditConfig } from '../chatConfig/edit';
import { showCompletedTasks } from '../TaskService/showCompletedTasks';
import { createListUsers } from '../userManagement/helper';
import { showAllUser } from '../userManagement/showAllUser';

export const handlerSelectChat = (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery().catch(() => {});
  const chatInternalId = Number(ctx.callbackQuery.data.split(':')[1]);

  const chatId = Number(ctx.callbackQuery.data.split(':')[2]);

  const chatTitle = String(ctx.callbackQuery.data.split(':')[3]);

  const action = String(ctx.callbackQuery.data.split(':')[4]);

  // TODO сделать уникалтные ключи и потом удалять
  ctx.session.chatInternalId = chatInternalId;
  ctx.session.chatId = chatId;
  ctx.session.chatTitle = chatTitle;

  switch (action) {
    case 'editStatusSendMR':
      createListUsers(ctx, 'editStatusSendMR', chatInternalId);
      break;
    case 'delete':
      createListUsers(ctx, 'delete', chatInternalId);
      break;
    case 'setUser':
      handleCommand(ctx, KeyCommand.setUser);
      break;
    case 'completedTasks':
      showCompletedTasks(ctx, chatInternalId);
      break;
    case 'allUser':
      showAllUser(ctx, chatInternalId);
      break;
    case 'editChatConfig':
      actionEditConfig(
        ctx,
        `Вы выбрали чат: ${chatTitle}. Что вы хотите отредактировать?`,
        chatId,
      );
      break;
    case 'updatePreset':
      createListUsers(ctx, 'updatePreset', chatInternalId);
      break;
    default:
      break;
  }
};
