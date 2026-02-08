import { InlineKeyboard } from 'grammy';
import {
  adminKeyboardMenu,
  chunkInlineKeyboardChats,
  userKeyboardMenu,
} from '../keyboards/keyboard';
import { MyContext, TCallbackQueryContext } from '../type';
import { getAllChats } from '../db/helpers';
import { findChatByChatId } from '../db';

import { isAdminUser } from '../helper/helper';
import {
  CommandAction,
  modKeybord,
  nameCallbackQuery,
} from '../keyboards/type';

export const commandShowListChat = async ({
  ctx,
  modKeybord = 'editText',
  text,
  action,
}: {
  ctx: TCallbackQueryContext | MyContext;
  modKeybord?: modKeybord;
  text: string;
  action: CommandAction;
}) => {
  const listChat = await getAllChats();

  const keyboardChat = InlineKeyboard.from(
    chunkInlineKeyboardChats({
      list: listChat,
      textQuery: 'selectChat',
      action,
    }),
  );

  switch (modKeybord) {
    case 'reply':
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

  const keybord = isAdminUser(ctx.from?.id || 0)
    ? adminKeyboardMenu
    : userKeyboardMenu;

  ctx.callbackQuery.message?.editText(`Меню чата: ${chat?.chatTitle}`, {
    reply_markup: keybord,
  });
};
