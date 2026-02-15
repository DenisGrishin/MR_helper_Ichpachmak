import { InlineKeyboard } from 'grammy';
import { MyContext } from '../../type';
import { KeyCommand } from '../../constant/constant';

export const actionEditConfig = async (
  ctx: MyContext,
  text: string,
  chatId: number,
) => {
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
    .text('<= Назад', `${KeyCommand.backToMenu}`);

  if (ctx.from?.id) {
    await ctx.callbackQuery?.message?.editText(text, {
      reply_markup: keyboardAskUserConfirmation,
    });
  }

  ctx.answerCallbackQuery();
};
