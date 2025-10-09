import 'dotenv/config';
import { Bot, GrammyError, HttpError, session } from 'grammy';
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
  CommandDispatcher,
  commandCompletedTasks,
} from './command';
import { KeyCommand, LIST_MY_COMMAND } from './command/constant';
import {
  hearsAssigneesReviewersMR,
  hearsPresetMR,
  hearsActiveMR,
  hearsDelMsgBot,
} from './hears';
import { MyContext, SessionData } from './type';
import { keyboardMenu } from './keyboards/keyboard';

// TODO убрать в отдельный файл типы

function initial(): SessionData {
  return { keyCommand: null, userId: null, timeToCheck: null };
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

bot.callbackQuery(KeyCommand.editStatusUser, commandEditStatusUser);

bot.callbackQuery(KeyCommand.delete, commandDeleteUser);

bot.callbackQuery(KeyCommand.updatePreset, commandUpdatePreset);

bot.callbackQuery(KeyCommand.deletePreset, commandDeletePreset);

bot.callbackQuery(KeyCommand.allUser, commandAllUser);

// todo вынести в отдельные фукции yesAnswer noAnswer
bot.callbackQuery(KeyCommand.yesAnswer, async (ctx) => {
  switch (ctx.session.keyCommand) {
    case KeyCommand.delete:
      await deleteUser(ctx.session.userId || 0);
      await commandDeleteUser(ctx);
      break;
    case KeyCommand.deletePreset:
      await deletePreset(ctx);
      await commandUpdatePreset(ctx);
      break;
    default:
      console.error(
        `Комманда была не назначина в callbackQuery ${KeyCommand.yesAnswer}`
      );
      break;
  }
  ctx.session.userId = null;
  ctx.session.keyCommand = null;
  ctx.answerCallbackQuery();
});

bot.callbackQuery(KeyCommand.noAnswer, async (ctx) => {
  switch (ctx.session.keyCommand) {
    case KeyCommand.delete:
      commandDeleteUser(ctx);
      break;
    case KeyCommand.deletePreset:
      commandUpdatePreset(ctx);
      break;

    default:
      console.error(
        `Комманда была не назначина в callbackQuery ${KeyCommand.noAnswer}`
      );
      break;
  }

  ctx.session.keyCommand = null;
  ctx.answerCallbackQuery();
});

bot.callbackQuery(/^editStatus-\d/, commandButtonEditUser);

bot.callbackQuery(/^delete-\d/, commandButtonDeleteUser);

bot.callbackQuery(/^preset-@*/, commandButtonPreset);

bot.callbackQuery(KeyCommand.backToMenu, async (ctx) => {
  ctx.callbackQuery.message?.editText('Выбирете пункт меню', {
    reply_markup: keyboardMenu,
  });
  ctx.answerCallbackQuery();
});

//============================================================
// команды через /
//============================================================

bot.command([KeyCommand.set], (ctx: MyContext) =>
  handleCommand(ctx, KeyCommand.set)
);

bot.command([KeyCommand.setIdGitLab], async (ctx: MyContext) =>
  handleCommand(ctx, KeyCommand.setIdGitLab)
);

bot.command([KeyCommand.completedTasks], async (ctx: MyContext) =>
  commandCompletedTasks(ctx)
);

bot.command([KeyCommand.menu], async (ctx: MyContext) => {
  await ctx.reply('Выбирете пункт', { reply_markup: keyboardMenu });
});

//============================================================
// соыбтия на MR
//============================================================

// git.russpass.dev gitlab.com — дергаем всех кто isActive
bot.hears(
  process.env.IS_DOMIN_PROD === 'true'
    ? /!!https:\/\/git.russpass.dev/
    : /!!https:\/\/gitlab.com/,
  hearsActiveMR
);

// дергаем тех кого добавили в гит idAssignees idReviewers
bot.hears(
  process.env.IS_DOMIN_PROD === 'true'
    ? /~https:\/\/git.russpass.dev/
    : /~https:\/\/gitlab.com/,
  hearsAssigneesReviewersMR
);

// дергаем по пресету
bot.hears(
  process.env.IS_DOMIN_PROD === 'true'
    ? /!https:\/\/git.russpass.dev/
    : /!https:\/\/gitlab.com/,
  hearsPresetMR
);

bot.hears('del-msg-bot', hearsDelMsgBot);

//============================================================
// обработка сообщений после команд /
//============================================================

bot.on('message', async (ctx: MyContext) => {
  if (!ctx.session.keyCommand) return;
  switch (ctx.session.keyCommand) {
    case KeyCommand.set:
      CommandDispatcherInstance.setUser(ctx);
      break;
    case KeyCommand.setIdGitLab:
      CommandDispatcherInstance.setIdGitLab(ctx);
      break;
  }
  ctx.session.keyCommand = null;
});

//============================================================
// Обработка ошибок
//============================================================

bot.catch(async (err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (ctx && ctx.reply) {
    try {
      await ctx.reply('Извините, произошла ошибка. Попробуйте позже.');
    } catch (replyError) {
      console.error('Не удалось отправить сообщение об ошибке:', replyError);
    }
  }

  // Логирование ошибки
  if (e instanceof GrammyError) {
    console.error('Ошибка в запросе:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Не удалось связаться с Telegram:', e);
  } else {
    console.error('Неизвестная ошибка:', e);
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
