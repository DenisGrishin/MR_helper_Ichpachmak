import { MyContext } from '../type';
import { KeyListCommand, TEXT_COMMAND } from './constant';

export const handleCommand = (ctx: MyContext, key: KeyListCommand) => {
  // todo lastCommand перименовать эту переменую
  ctx.session.keyCommand = key;

  ctx.reply(TEXT_COMMAND[key], {
    reply_parameters: { message_id: ctx.msg!.message_id },
  });
};
