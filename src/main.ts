import 'dotenv/config';
import { Bot } from 'grammy';
import logger from '../logger/logger';
import { MyContext } from './type';
import { BotInstance } from './BotInstance';

const bot = new Bot<MyContext>(`${process.env.BOT_API_KEY}`);

//============================================================
// Функция запуска бота
//============================================================

new BotInstance(bot);

async function startBot(bot: Bot<MyContext>): Promise<void> {
  try {
    bot.start({
      onStart: () => {
        logger.info({
          msg: 'Bot started',
        });
      },
    });
  } catch (error) {
    logger.error({
      msg: 'Error in startBot',
      error: error instanceof Error ? error.message : error,
    });
  }
}

startBot(bot);
