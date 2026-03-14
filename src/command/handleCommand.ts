import { KeyCommand } from '../constant/constant';
import { MyContext } from '../type';
import { TEXT_COMMAND } from './constant';
import { logger } from '../config';

export const handleCommand = (ctx: MyContext, key: KeyCommand) => {
  logger.info(`Обработка команды: ${key}`);

  ctx.session.keyCommand = key;

  ctx.reply(TEXT_COMMAND[key], {
    reply_parameters: { message_id: ctx.msg!.message_id },
  });

  logger.info(`Команда ${key} обработана успешно`);
};
