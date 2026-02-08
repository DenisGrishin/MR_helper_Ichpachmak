import { InlineKeyboard } from 'grammy';

import { ChatСonfig } from '../../db';
import { MyContext } from '../../type';
import { KeyCommand } from '../../constant/constant';

export const actionAddConfig = async (
  ctx: MyContext,
  text: string,
  chatId: string,
) => {
  const keyboardAskUserConfirmation = new InlineKeyboard()
    .text(
      'Добавить название проекта',
      `${KeyCommand.addConfigChat}${chatId}-chatTitle`,
    )
    .row()
    .text(
      'Добавить токен GitLab',
      `${KeyCommand.addConfigChat}${chatId}-tokenGitLab`,
    );

  if (ctx.from?.id) {
    await ctx.api.sendMessage(ctx.from.id, text, {
      reply_markup: keyboardAskUserConfirmation,
    });
  }
};

export const addConfigChat = async (
  ctx: MyContext,
  chatId?: string | null,
  filedUpdateBD?: keyof ChatСonfig,
) => {
  const chatTitle = ctx.message?.text;

  if (!chatId || !chatTitle || !filedUpdateBD) return;

  await ChatСonfig.updateFieldByChatId(chatId, filedUpdateBD, chatTitle);

  await ctx.reply('Данные успешно сохранены!');
};
