import { BotError, GrammyError, HttpError } from 'grammy';
import { MyContext } from '../../type';
import logger from '../../../logger/logger';

export const ErrorObserve = async (err: BotError<MyContext>) => {
  const ctx = err.ctx;
  logger.error({
    msg: `Error while handling update ${ctx.update.update_id}`,
  });
  const e = err.error;

  if (ctx && ctx.reply) {
    try {
      await ctx.reply('Извините, произошла ошибка. Попробуйте позже.');
    } catch (replyError) {
      logger.error({
        msg: 'Не удалось отправить сообщение об ошибке',
        error: replyError instanceof Error ? replyError.message : replyError,
      });
    }
  }

  if (e instanceof GrammyError) {
    logger.error({
      msg: 'Ошибка в запросе',
      error: e.description,
    });
  } else if (e instanceof HttpError) {
    logger.error({
      msg: 'Не удалось связаться с Telegram',
      error: e instanceof Error ? e.message : e,
    });
  } else {
    logger.error({
      msg: 'Неизвестная ошибка',
      error: e instanceof Error ? e.message : e,
    });
  }
};
