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

function initialState(): SessionData {
  return { keyCommand: null, userId: null };
}

export class BotInstance {
  private tokenGitLab: string | null = null;
  private baseUrl: string | null = null;
  private projectID: string | null = null;
  bot: Bot<MyContext>;
  commandDispatcherInstance;

  constructor({
    tokenGitLab,
    baseUrl,
    projectID,
    bot,
  }: {
    tokenGitLab?: string | null;
    baseUrl?: string | null;
    projectID?: string | null;
    bot: Bot<MyContext>;
  }) {
    // this.tokenGitLab = tokenGitLab;
    // this.baseUrl = baseUrl;
    // this.projectID = projectID;
    this.bot = bot;

    this.commandDispatcherInstance = new CommandDispatcher();

    this.bot.use(session({ initial: initialState }));
    //плагин для интерактивного меню
    this.bot.use(hydrate());

    this.bot.api.setMyCommands(LIST_MY_COMMAND);

    // тут надо соблюдать порядок вызовов
    // TODO найти про это инфу
    this.initHears();
    this.initCommands();
    this.initInteractiveMenu();
    this.initErrorObserver();
  }

  initHears() {
    //============================================================
    // слушутели на MR
    //============================================================

    // git.russpass.dev gitlab.com — дергаем всех кто isActive
    this.bot.hears(
      process.env.IS_DOMIN_PROD === 'true'
        ? /!!https:\/\/git.russpass.dev/
        : /!!https:\/\/gitlab.com/,
      hearsActiveMR
    );

    // дергаем тех кого добавили в гит idAssignees idReviewers
    this.bot.hears(
      process.env.IS_DOMIN_PROD === 'true'
        ? /~https:\/\/git.russpass.dev/
        : /~https:\/\/gitlab.com/,
      hearsAssigneesReviewersMR
    );

    // дергаем по пресету
    this.bot.hears(
      process.env.IS_DOMIN_PROD === 'true'
        ? /!https:\/\/git.russpass.dev/
        : /!https:\/\/gitlab.com/,
      hearsPresetMR
    );

    this.bot.hears('del-msg-bot', hearsDelMsgBot);
  }

  initInteractiveMenu() {
    //============================================================
    // команды интерактивного меню
    //============================================================

    this.bot.callbackQuery(KeyCommand.editStatusUser, commandEditStatusUser);

    this.bot.callbackQuery(KeyCommand.delete, commandDeleteUser);

    this.bot.callbackQuery(KeyCommand.updatePreset, commandUpdatePreset);

    this.bot.callbackQuery(KeyCommand.deletePreset, commandDeletePreset);

    this.bot.callbackQuery(KeyCommand.allUser, commandAllUser);

    // todo вынести в отдельные фукции yesAnswer noAnswer
    this.bot.callbackQuery(KeyCommand.yesAnswer, async (ctx) => {
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

    this.bot.callbackQuery(KeyCommand.noAnswer, async (ctx) => {
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

    this.bot.callbackQuery(/^editStatus-\d/, commandButtonEditUser);

    this.bot.callbackQuery(/^delete-\d/, commandButtonDeleteUser);

    this.bot.callbackQuery(/^preset-@*/, commandButtonPreset);

    this.bot.callbackQuery(KeyCommand.backToMenu, async (ctx) => {
      ctx.callbackQuery.message?.editText('Выбирете пункт меню', {
        reply_markup: keyboardMenu,
      });
      ctx.answerCallbackQuery();
    });
  }

  initCommands() {
    //============================================================
    // команды через /
    //============================================================

    this.bot.command([KeyCommand.set], (ctx: MyContext) =>
      handleCommand(ctx, KeyCommand.set)
    );

    this.bot.command([KeyCommand.setIdGitLab], async (ctx: MyContext) =>
      handleCommand(ctx, KeyCommand.setIdGitLab)
    );

    this.bot.command([KeyCommand.completedTasks], async (ctx: MyContext) =>
      commandCompletedTasks(ctx)
    );

    this.bot.command([KeyCommand.menu], async (ctx: MyContext) => {
      await ctx.reply('Выбирете пункт', { reply_markup: keyboardMenu });
    });

    //============================================================
    // обработка сообщений после команд /
    //============================================================

    this.bot.on('message', async (ctx: MyContext) => {
      if (!ctx.session.keyCommand) return;
      switch (ctx.session.keyCommand) {
        case KeyCommand.set:
          this.commandDispatcherInstance.setUser(ctx);
          break;
        case KeyCommand.setIdGitLab:
          this.commandDispatcherInstance.setIdGitLab(ctx);
          break;
      }
      ctx.session.keyCommand = null;
    });
  }

  initErrorObserver() {
    //============================================================
    // Обработка ошибок
    //============================================================

    this.bot.catch(async (err) => {
      const ctx = err.ctx;
      console.error(`Error while handling update ${ctx.update.update_id}:`);
      const e = err.error;

      if (ctx && ctx.reply) {
        try {
          await ctx.reply('Извините, произошла ошибка. Попробуйте позже.');
        } catch (replyError) {
          console.error(
            'Не удалось отправить сообщение об ошибке:',
            replyError
          );
        }
      }

      if (e instanceof GrammyError) {
        console.error('Ошибка в запросе:', e.description);
      } else if (e instanceof HttpError) {
        console.error('Не удалось связаться с Telegram:', e);
      } else {
        console.error('Неизвестная ошибка:', e);
      }
    });
  }
}
