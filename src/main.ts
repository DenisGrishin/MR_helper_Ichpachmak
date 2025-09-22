import 'dotenv/config';
import { Bot, GrammyError, HttpError, session } from 'grammy';
import { CommandDispatcher } from './CommandDispatcher';
import { hydrate } from '@grammyjs/hydrate';
import {
  handleCommand,
  commandAllUser,
  commandEditStatusUser,
  commandButtonEditUser,
  commandDeleteUser,
  commandButtonDeleteUser,
  deleteUser,
  commandUpdatePreset,
  commandDeletePreset,
  deletePreset,
  commandButtonPreset,
} from './command';
import { KeyListCommand, LIST_MY_COMMAND } from './command/constant';
import {
  handlerAssigneesReviewersMR,
  handlerPresetMR,
  handlerActiveMR,
} from './handler';
import { MyContext, SessionData } from './type';
import { keyboardMenu } from './keyboards/keyboard';

// TODO убрать в отдельный файл типы

function initial(): SessionData {
  return { keyCommand: null, userId: null };
}

const bot = new Bot<MyContext>(process.env.BOT_API_KEY as string);

const CommandDispatcherInstance = new CommandDispatcher();

bot.use(session({ initial }));
//плагин для интерактивного меню
bot.use(hydrate());

bot.api.setMyCommands(LIST_MY_COMMAND);

//============================================================
// команды интерактивного меню
//============================================================

bot.callbackQuery(KeyListCommand.editStatusUser, commandEditStatusUser);

bot.callbackQuery(KeyListCommand.delete, commandDeleteUser);

bot.callbackQuery(KeyListCommand.updatePreset, commandUpdatePreset);

bot.callbackQuery(KeyListCommand.deletePreset, commandDeletePreset);

bot.callbackQuery(KeyListCommand.allUser, commandAllUser);

// todo вынести в отдельные фукции yesAnswer noAnswer
bot.callbackQuery(KeyListCommand.yesAnswer, async (ctx) => {
  switch (ctx.session.keyCommand) {
    case KeyListCommand.delete:
      await deleteUser(ctx.session.userId || 0);
      await commandUpdatePreset(ctx);
      break;
    case KeyListCommand.deletePreset:
      await deletePreset(ctx);
      await commandUpdatePreset(ctx);
      break;
    default:
      console.error(
        `Комманда была не назначина в callbackQuery ${KeyListCommand.yesAnswer}`
      );
      break;
  }
  ctx.session.userId = null;
  ctx.session.keyCommand = null;
  ctx.answerCallbackQuery();
});

bot.callbackQuery(KeyListCommand.noAnswer, async (ctx) => {
  switch (ctx.session.keyCommand) {
    case KeyListCommand.delete:
      commandDeleteUser(ctx);
      break;
    case KeyListCommand.deletePreset:
      commandUpdatePreset(ctx);
      break;

    default:
      console.error(
        `Комманда была не назначина в callbackQuery ${KeyListCommand.noAnswer}`
      );
      break;
  }

  ctx.session.keyCommand = null;
  ctx.answerCallbackQuery();
});

bot.callbackQuery(/^editStatus-\d/, commandButtonEditUser);

bot.callbackQuery(/^delete-\d/, commandButtonDeleteUser);

bot.callbackQuery(/^preset-@*/, commandButtonPreset);

bot.callbackQuery(KeyListCommand.backToMenu, async (ctx) => {
  ctx.callbackQuery.message?.editText('Выбирете пункт меню', {
    reply_markup: keyboardMenu,
  });
  ctx.answerCallbackQuery();
});

//============================================================
// команды через /
//============================================================

bot.command([KeyListCommand.set], (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.set)
);

bot.command([KeyListCommand.setIdGitLab], async (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.setIdGitLab)
);

bot.command([KeyListCommand.menu], async (ctx: MyContext) => {
  await ctx.reply('Выбирете пункт', { reply_markup: keyboardMenu });
});

//============================================================
// соыбтия на MR
//============================================================

// git.russpass.dev gitlab.com — дергаем всех кто isActive
bot.hears(/!!https:\/\/gitlab.com/, handlerActiveMR);

// дергаем тех кого добавили в гит idAssignees idReviewers
bot.hears(/~https:\/\/gitlab.com/, handlerAssigneesReviewersMR);

// дергаем по пресету
bot.hears(/!https:\/\/gitlab.com/, handlerPresetMR);

//============================================================
// обработка сообщений после команд /
//============================================================

bot.on('message', async (ctx: MyContext) => {
  if (!ctx.session.keyCommand) return;

  const msg = ctx.message!.text!;
  const msgNameId = msg.split(' ').filter((el) => !!el);
  const matches = msg.match(/@\w+/g);

  switch (ctx.session.keyCommand) {
    case KeyListCommand.set:
      CommandDispatcherInstance.setUser(matches, ctx);
      break;
    case KeyListCommand.setIdGitLab:
      CommandDispatcherInstance.setIdGitLab(msgNameId, ctx);
      break;
  }
  ctx.session.keyCommand = null;
});

//============================================================
// Обработка ошибок согласно документации
//============================================================

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

//============================================================
// Функция запуска бота
//============================================================

async function startBot(): Promise<void> {
  try {
    bot.start();
    console.log('Bot started');
  } catch (error) {
    console.error('Error in startBot:', error);
  }
}

startBot();
