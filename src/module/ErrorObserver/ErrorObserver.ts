import { BotError, GrammyError, HttpError } from 'grammy';
import { MyContext } from '../../type';

export const ErrorObserve = async (err: BotError<MyContext>) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (ctx && ctx.reply) {
    try {
      await ctx.reply('Извините, произошла ошибка. Попробуйте позже.');
    } catch (replyError) {
      console.error('Не удалось отправить сообщение об ошибке:', replyError);
    }
  }

  if (e instanceof GrammyError) {
    console.error('Ошибка в запросе:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Не удалось связаться с Telegram:', e);
  } else {
    console.error('Неизвестная ошибка:', e);
  }
};
