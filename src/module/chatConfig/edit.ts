import { InlineKeyboard } from 'grammy';
import { MyContext } from '../../type';
import { KeyCommand } from '../../constant/constant';
import { logger } from '../../config';

export const actionEditConfig = async (
  ctx: MyContext,
  text: string,
  chatId: number,
) => {
  try {
    const keyboardAskUserConfirmation = new InlineKeyboard()
      .text(
        'Изменить название проекта',
        `${KeyCommand.addConfigChat}:${chatId}:chatTitle`,
      )
      .row()
      .text(
        'Изменить токен GitLab',
        `${KeyCommand.addConfigChat}:${chatId}:tokenGitLab`,
      )
      .row()
      .text('< Назад', `${KeyCommand.backToMenu}`);

    if (ctx.from?.id) {
      await ctx.callbackQuery?.message?.editText(text, {
        reply_markup: keyboardAskUserConfirmation,
      });
      logger.info('Меню редактирования отправлено пользователю');
    }

    ctx.answerCallbackQuery();
  } catch (error) {
    logger.error(
      `Ошибка в actionEditConfig: ${error instanceof Error ? error.message : error}`,
    );
  }
};
