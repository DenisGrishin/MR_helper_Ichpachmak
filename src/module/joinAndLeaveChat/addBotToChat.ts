import { MyContext } from '../../type';
import { actionAddConfig } from '../chatConfig/add';
import { ChatСonfig } from '../../db';
import { logger } from '../../config';

export const addBotToChat = async (ctx: MyContext, chatTitle: string) => {
  logger.info(`Бот добавлен в чат: ${chatTitle}`);

  const chatId = String(ctx.chat?.id);
  const whoAdded = ctx.message?.from;

  if (!whoAdded) {
    logger.warn('Не удалось определить пользователя, добавившего бота');
    return;
  }

  if (ctx.chat?.type === 'private') {
    logger.info('Попытка добавить бота в личный чат, игнорируем');
    return;
  }

  try {
    await ctx.reply(
      '⚠️ Бот должен быть администратором для полной функциональности, но продолжаем...\n\n✅ Настройки отправлены в личные сообщения.',
    );

    await ctx.api.sendMessage(
      whoAdded.id,
      `Привет, ${whoAdded.first_name}! Ты добавил меня в чат «${chatTitle}» 👋`,
    );

    actionAddConfig(
      ctx,
      'Нужно будет заполнить конфигурацию для этого чата.',
      chatId,
    );

    logger.info(`Конфигурация для чата ${chatId} инициализирована`);
  } catch (e) {
    logger.error(
      `Ошибка при отправке сообщения пользователю: ${e instanceof Error ? e.message : e}`,
    );

    await ctx.api.sendMessage(
      whoAdded.id,
      '❌ Не могу отправить вам сообщение. Напишите мне в личку и нажмите /start.',
    );

    throw new Error(
      '❌ Не могу отправить вам сообщение. Напишите мне в личку и нажмите /start',
    );
  }

  ChatСonfig.create(chatId, chatTitle, (err) => {
    if (err) {
      logger.error(`Ошибка создания конфигурации чата ${chatId}: ${err}`);
    } else {
      logger.info(
        `Конфигурация чата ${chatTitle} успешно создана в базе данных`,
      );
    }
  });
};
