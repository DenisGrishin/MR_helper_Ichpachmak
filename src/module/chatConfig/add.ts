import { InlineKeyboard } from 'grammy';

import { ChatСonfig } from '../../db';
import { MyContext, TCallbackQueryContext } from '../../type';
import { KeyCommand, LIST_FIELD_CHAT_CONFIG } from '../../constant/constant';

export const actionAddConfig = async (
  ctx: MyContext,
  text: string,
  chatId: string,
) => {
  const keyboardAskUserConfirmation = new InlineKeyboard()
    .text(
      'Добавить название проекта',
      `${KeyCommand.addConfigChat}:${chatId}:chatTitle`,
    )
    .row()
    .text(
      'Добавить токен GitLab',
      `${KeyCommand.addConfigChat}:${chatId}:tokenGitLab`,
    );

  if (ctx.from?.id) {
    await ctx.api.sendMessage(ctx.from.id, text, {
      reply_markup: keyboardAskUserConfirmation,
    });
  }
};

export const addConfigChat = async (
  ctx: MyContext,
  chatId?: number | null,
  filedUpdateBD?: keyof ChatСonfig,
) => {
  const chatTitle = ctx.message?.text;

  if (!chatId || !chatTitle || !filedUpdateBD) return;

  await ChatСonfig.updateFieldByChatId(chatId, filedUpdateBD, chatTitle);

  await ctx.reply('Данные успешно сохранены!');
};

export const handlerAddConfigChat = async (ctx: TCallbackQueryContext) => {
  const chatId = Number(ctx.callbackQuery.data.split(':')[1]);

  const filedBD = String(
    ctx.callbackQuery.data.split(':')[2],
  ) as keyof ChatСonfig;

  (await ctx.reply(
    `Введите ${LIST_FIELD_CHAT_CONFIG[filedBD]} для этого чата.`,
  ),
    (ctx.session.keyCommand = KeyCommand.addConfigChat));

  ctx.session.chatId = Number(chatId);
  ctx.session.filedUpdateBD = filedBD;
};
