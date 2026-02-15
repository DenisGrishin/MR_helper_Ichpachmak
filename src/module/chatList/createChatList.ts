import { InlineKeyboard } from 'grammy';
import { getAllChats } from '../../db/helpers';
import { CommandAction, modKeybord } from '../../keyboards/type';
import { MyContext, TCallbackQueryContext } from '../../type';
import {
  adminKeyboardMenu,
  chunkInlineKeyboardChats,
  userKeyboardMenu,
} from '../../keyboards/keyboard';
import { findChatByChatId } from '../../db';
import { isAdminUser } from '../../helper/helper';

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

  if (!listChat.length) {
    await ctx.reply(
      'Пока нет ни одного чата, добавьте чат, чтобы начать работу',
    );
    return;
  }

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
  const id = Number(ctx.callbackQuery.data.split(':')[1]);
  const chat = await findChatByChatId(`-${id}`);

  const keybord = isAdminUser(ctx.from?.id || 0)
    ? adminKeyboardMenu
    : userKeyboardMenu;

  ctx.callbackQuery.message?.editText(`Меню чата: ${chat?.chatTitle}`, {
    reply_markup: keybord,
  });

  ctx.answerCallbackQuery();
};
