import { InlineKeyboard } from 'grammy';
import { chunkInlineKeyboardChats, keyboardMenu } from '../keyboards/keyboard';
import { MyContext, TCallbackQueryContext } from '../type';
import { getAllChats } from '../db/helpers';
import { findChatByChatId } from '../db';
import { CommandUserAction } from '../keyboards/type';

export const commandShowListChat = async (
  ctx: TCallbackQueryContext | MyContext,
  textQuery: CommandUserAction,
  text: string,
) => {
  const listChat = await getAllChats();

  const keyboardChat = InlineKeyboard.from(
    chunkInlineKeyboardChats({ list: listChat, textQuery }),
  );

  switch (textQuery) {
    case 'setUser':
      ctx.reply(text, {
        reply_markup: keyboardChat,
      });
      break;
    default:
      await ctx.callbackQuery?.message?.editText(text, {
        reply_markup: keyboardChat,
      });
      break;
  }
};

export const commandMenuChat = async (ctx: TCallbackQueryContext) => {
  const id = Number(ctx.callbackQuery.data.split('-')[1]);
  // тире добавляем "-" потому в базе записано тире в id
  const chat = await findChatByChatId(`-${id}`);

  ctx.answerCallbackQuery();

  ctx.callbackQuery.message?.editText(`Меню чата: ${chat?.chatTitle}`, {
    reply_markup: keyboardMenu,
  });
};
