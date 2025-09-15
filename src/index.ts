import 'dotenv/config';
import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  session,
  SessionFlavor,
} from 'grammy';
import { getAllUsers, findUsersByIdGitlab, findUser } from './db/helpers';
import { ApiGitLab } from './api/apiGitLab';
import { CommandDispatcher } from './CommandDispatcher';
import { IUser } from './db/db';
import { handleCommand, commandAllUser, commandShowPreset } from './command';
import { KeyListCommand, listMyCommand } from './command/constant';
import {
  handlerAssigneesReviewersMR,
  handlerPresetMR,
  handlerActiveMR,
} from './handler';
// TODO убрать в отдельный файл типы
interface SessionData {
  lastCommand?: KeyListCommand | null;
}

export type MyContext = Context & SessionFlavor<SessionData>;

function initial(): SessionData {
  return { lastCommand: null };
}

const bot = new Bot<MyContext>(process.env.BOT_API_KEY as string);
const CommandDispatcherInstance = new CommandDispatcher();

bot.use(session({ initial }));

bot.api.setMyCommands(listMyCommand);

bot.command([KeyListCommand.set], (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.set)
);

bot.command([KeyListCommand.enable], (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.enable)
);

bot.command([KeyListCommand.disabled], async (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.disabled)
);

bot.command([KeyListCommand.delete], async (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.delete)
);

bot.command([KeyListCommand.allUser], commandAllUser);

bot.command([KeyListCommand.updatePreset], async (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.updatePreset)
);

bot.command([KeyListCommand.setIdGitLab], async (ctx: MyContext) =>
  handleCommand(ctx, KeyListCommand.setIdGitLab)
);

bot.command([KeyListCommand.showPreset], commandShowPreset);

// git.russpass.dev gitlab.com — дергаем всех кто isActive
bot.hears(/!!https:\/\/gitlab.com/, handlerActiveMR);

// дергаем тех кого добавили в гит idAssignees idReviewers
bot.hears(/~https:\/\/gitlab.com/, handlerAssigneesReviewersMR);

// дергаем по пресету
bot.hears(/!https:\/\/gitlab.com/, handlerPresetMR);

// обработка сообщений после команд
bot.on('message', async (ctx: MyContext) => {
  if (!ctx.session.lastCommand) return;

  const msg = ctx.message!.text!;
  const msgNameId = msg.split(' ').filter((el) => !!el);
  const matches = msg.match(/@\w+/g);

  switch (ctx.session.lastCommand) {
    case KeyListCommand.enable:
      CommandDispatcherInstance.enabelUser(matches, ctx);
      break;
    case KeyListCommand.disabled:
      CommandDispatcherInstance.disabledUser(matches, ctx);
      break;
    case KeyListCommand.set:
      CommandDispatcherInstance.setUser(matches, ctx);
      break;
    case KeyListCommand.delete:
      CommandDispatcherInstance.deleteUser(matches, ctx);
      break;
    case KeyListCommand.setIdGitLab:
      CommandDispatcherInstance.setIdGitLab(msgNameId, ctx);
      break;
    case KeyListCommand.updatePreset:
      CommandDispatcherInstance.updatePreset(matches, ctx);
      break;
  }
  ctx.session.lastCommand = null;
});

// Обработка ошибок согласно документации
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

// Функция запуска бота
async function startBot(): Promise<void> {
  try {
    bot.start();
    console.log('Bot started');
  } catch (error) {
    console.error('Error in startBot:', error);
  }
}

startBot();
