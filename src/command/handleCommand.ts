import { MyContext } from '..';
import { KeyListCommand, textCommand } from './constant';

export const handleCommand = (ctx: MyContext, commandKey: KeyListCommand) => {
  ctx.session.lastCommand = commandKey;

  ctx.reply(textCommand[commandKey], {
    reply_parameters: { message_id: ctx.msg!.message_id },
  });
};
