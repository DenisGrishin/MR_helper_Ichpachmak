import { MyContext } from '../type';
import { KeyCommand, TEXT_COMMAND } from './constant';

export const handleCommand = (ctx: MyContext, key: KeyCommand) => {
  ctx.session.keyCommand = key;

  ctx.reply(TEXT_COMMAND[key], {
    reply_parameters: { message_id: ctx.msg!.message_id },
  });
};
