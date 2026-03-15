import { BotError, GrammyError, HttpError } from 'grammy';
import { MyContext } from '../../type';
import { logger } from '../../config';

export const ErrorObserve = async (err: BotError<MyContext>) => {
  const ctx = err.ctx;
  const e = err.error;
  logger.error({
    msg: `Error while handling update ${ctx.update.update_id}`,
  });

  console.log('Error Type:', e instanceof Error ? e.name : typeof e);
  console.log('Error Message:', e instanceof Error ? e.message : String(e));
  console.log(
    'Error Stack:',
    e instanceof Error ? e.stack : 'No stack available',
  );
  console.log('Full Error Object:', JSON.stringify(e, null, 2));

  if (ctx && ctx.reply) {
    try {
      await ctx.reply('Извините, произошла ошибка. Попробуйте позже.');
      console.log('Сообщение об ошибке отправлено пользователю');
    } catch (replyError) {
      console.log('Не удалось отправить сообщение об ошибке:', replyError);
      logger.error({
        msg: 'Не удалось отправить сообщение об ошибке',
        error: replyError instanceof Error ? replyError.message : replyError,
      });
    }
  }

  if (e instanceof GrammyError) {
    console.log('GrammyError - Код:', e.error_code);
    console.log('GrammyError - Описание:', e.description);
    console.log('GrammyError - Метод:', e.method);
    logger.error({
      msg: 'Ошибка в запросе',
      error: e.description,
    });
  } else if (e instanceof HttpError) {
    console.log('HttpError:', e.message);
    logger.error({
      msg: 'Не удалось связаться с Telegram',
      error: e instanceof Error ? e.message : e,
    });
  } else {
    console.log('Неизвестная ошибка');
    logger.error({
      msg: 'Неизвестная ошибка',
      error: e instanceof Error ? e.message : e,
    });
  }

  console.log('='.repeat(50));
  console.log('КОНЕЦ ЛОГА ОШИБКИ');
  console.log('='.repeat(50));
};
