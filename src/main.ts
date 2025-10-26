import 'dotenv/config';
import { Bot } from 'grammy';

import { MyContext } from './type';
import { BotInstance } from './BotInstance';

const bot = new Bot<MyContext>(process.env.BOT_API_KEY as string);

new BotInstance({ bot: bot });

//============================================================
// Функция запуска бота
//============================================================

async function startBot(): Promise<void> {
  try {
    await bot.start();
    console.log('Bot started');
  } catch (error) {
    console.error('Error in startBot:', error);
  }
}

startBot();
