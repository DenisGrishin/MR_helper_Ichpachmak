import { InlineKeyboard } from 'grammy';
import { getAllChats } from '../../db/helpers';
import { CommandAction, modKeybord } from '../../keyboards/type';
import { MyContext, TCallbackQueryContext } from '../../type';
import { chunkInlineKeyboardChats } from '../../keyboards/keyboard';

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
  // todo показать чаты где находиться юзер
  // const user = await Users.findByUser(`@${ctx.from?.username}`);
  // const listChat = await Users.findUserChats(user.id);

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
