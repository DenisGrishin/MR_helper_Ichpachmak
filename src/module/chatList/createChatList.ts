import { InlineKeyboard } from 'grammy';
import { CommandAction, modKeybord } from '../../keyboards/type';
import { MyContext, TCallbackQueryContext } from '../../type';
import { chunkInlineKeyboardChats } from '../../keyboards/keyboard';
import { ChatСonfig } from '../../db';
import { logger } from '../../config';

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
  try {
    // todo показать чаты где находиться юзер
    // const user = await Users.findByUser(`@${ctx.from?.username}`);
    // const listChat = await Users.findUserChats(user.id);

    const listChat = await ChatСonfig.all();

    if (!listChat.length) {
      logger.info('Список чатов пуст');
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
        logger.info('Список чатов отправлен как новое сообщение');
        break;
      default:
        await ctx.callbackQuery?.message?.editText(text, {
          reply_markup: keyboardChat,
        });
        logger.info('Список чатов обновлен в сообщении');
        break;
    }
  } catch (error) {
    logger.error(
      `Ошибка в commandShowListChat: ${error instanceof Error ? error.message : error}`,
    );
  }
};
