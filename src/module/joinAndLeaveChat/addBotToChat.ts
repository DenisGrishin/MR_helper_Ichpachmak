import { MyContext } from '../../type';
import { actionAddConfig } from '../chatConfig/add';
import { ChatСonfig } from '../../db';

export const addBotToChat = async (ctx: MyContext, chatTitle: string) => {
  const chatId = String(ctx.chat?.id);
  const whoAdded = ctx.message?.from;

  if (!whoAdded) return;
  if (ctx.chat?.type === 'private') return;

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
  } catch (e) {
    await ctx.api.sendMessage(
      whoAdded.id,
      '❌ Не могу отправить вам сообщение. Напишите мне в личку и нажмите /start.',
    );

    throw new Error(
      '❌ Не могу отправить вам сообщение. Напишите мне в личку и нажмите /start',
    );
  }

  ChatСonfig.create(chatId, chatTitle, (err) => {
    if (err) console.error('Ошибка создания конфига', err);
  });
};
