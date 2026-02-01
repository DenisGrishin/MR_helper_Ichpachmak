import 'dotenv/config';
import { Bot } from 'grammy';

import { MyContext } from './type';
import { BotInstance } from './BotInstance';

const bot = new Bot<MyContext>(`${process.env.BOT_API_KEY}`);

export const GITLAB_TOKENS: Record<string, string | undefined> = {
  '-5279425311': `${process.env.TOKEN_GIT_LAB_test_1}`,
  '-1003666000533': `${process.env.TOKEN_GIT_LAB_test_2}`,
};

new BotInstance({
  bot,
});

//============================================================
// Функция запуска бота
//============================================================

async function startBot(bot: any): Promise<void> {
  try {
    await bot.start();
    console.log('Bot started');
  } catch (error) {
    console.error('Error in startBot:', error);
  }
}

startBot(bot);

// 1. отпрляем мр
// 2. вытягиваем всех активн  юузеров
// 3. смотрим на чат id откуда было отправлина
// 3. выбираем по id У сущности, и фильтруем и показываем

// добавить конфигурацию для чата
// когда бот проваливаеться в чат,  поядяеьбся запсиь в базе
// когда нажимаем меню появялеться

// как добвляем юзерам чат id ?
//  новая запись в базе.
//  существующая

// через чат
//
//  или в личку
// надо добавлять id чата
