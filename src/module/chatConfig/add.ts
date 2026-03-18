import { InlineKeyboard } from 'grammy';

import { ChatСonfig } from '../../db';
import { MyContext, TCallbackQueryContext } from '../../type';
import { KeyCommand, LIST_FIELD_CHAT_CONFIG } from '../../constant/constant';
import { logger } from '../../config';

export const actionAddConfig = async (
  ctx: MyContext,
  text: string,
  chatId: string,
) => {
  try {
    const keyboardAskUserConfirmation = new InlineKeyboard()
      .text(
        'Добавить название проекта',
        `${KeyCommand.addConfigChat}:${chatId}:chatTitle`,
      )
      .row()
      .text(
        'Добавить токен GitLab',
        `${KeyCommand.addConfigChat}:${chatId}:tokenGitLab`,
      )
      .row()
      .text(
        'Добавить baseUrl для GitLab',
        `${KeyCommand.addConfigChat}:${chatId}:gitBaseUrl`,
      );

    if (ctx.from?.id) {
      await ctx.api.sendMessage(ctx.from.id, text, {
        reply_markup: keyboardAskUserConfirmation,
      });
      logger.info('Меню конфигурации отправлено пользователю');
    }
  } catch (error) {
    logger.error(
      `Ошибка в actionAddConfig: ${error instanceof Error ? error.message : error}`,
    );
  }
};

export const addConfigChat = async (
  ctx: MyContext,
  chatId?: number | null,
  filedUpdateBD?: keyof ChatСonfig,
) => {
  try {
    const chatTitle = ctx.message?.text;

    if (!chatId || !chatTitle || !filedUpdateBD) return;

    logger.info(
      `Сохранение конфигурации: поле ${filedUpdateBD} для чата ${chatId}`,
    );

    await ChatСonfig.updateFieldByChatId(chatId, filedUpdateBD, chatTitle);

    await ctx.reply('Данные успешно сохранены!');
    logger.info(`Конфигурация успешно сохранена для чата ${chatId}`);
  } catch (error) {
    logger.error(
      `Ошибка при сохранении конфигурации: ${error instanceof Error ? error.message : error}`,
    );
  }
};

export const handlerAddConfigChat = async (ctx: TCallbackQueryContext) => {
  try {
    const chatId = Number(ctx.callbackQuery.data.split(':')[1]);

    const filedBD = String(
      ctx.callbackQuery.data.split(':')[2],
    ) as keyof ChatСonfig;

    logger.info(`Запрос на редактирование поля ${filedBD} чата ${chatId}`);

    (await ctx.reply(
      `Введите ${LIST_FIELD_CHAT_CONFIG[filedBD]} для этого чата.`,
      {
        disable_web_page_preview: true,
      } as any,
    ),
      (ctx.session.keyCommand = KeyCommand.addConfigChat));

    ctx.session.chatId = Number(chatId);
    ctx.session.filedUpdateBD = filedBD;

    logger.info(`Ожидание ввода значения для поля ${filedBD}`);
  } catch (error) {
    logger.error(
      `Ошибка в handlerAddConfigChat: ${error instanceof Error ? error.message : error}`,
    );
  }
};
