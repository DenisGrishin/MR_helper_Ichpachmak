import 'dotenv/config';
import { Bot } from 'grammy';

import { MyContext } from './type';
import { BotInstance } from './BotInstance';

const bot = new Bot<MyContext>(`${process.env.BOT_API_KEY}`);

new BotInstance({
  bot,
});

//============================================================
// Функция запуска бота
//============================================================

async function startBot(bot: Bot<MyContext>): Promise<void> {
  try {
    await bot.start();
    console.log('Bot started');
  } catch (error) {
    console.error('Error in startBot:', error);
  }
}

startBot(bot);
