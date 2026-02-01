import 'dotenv/config';
import { Bot, GrammyError, HttpError, session } from 'grammy';
import { hydrate } from '@grammyjs/hydrate';
import {
  handleCommand,
  commandAllUser,
  commandUserAction,
  commandButtonEditUser,
  commandButtonDeleteUser,
  deleteUser,
  commandUpdatePreset,
  commandDeletePreset,
  deletePreset,
  commandButtonPreset,
  CommandDispatcher,
  commandCompletedTasks,
  commandShowListChat,
  commandMenuChat,
} from './command';
import { KeyCommand, LIST_MY_COMMAND } from './command/constant';
import {
  hearsAssigneesReviewersMR,
  hearsPresetMR,
  hearsActiveMR,
  hearsDelMsgBot,
} from './hears';
import { MyContext, SessionData, TCallbackQueryContext } from './type';
import { keyboardMenu } from './keyboards/keyboard';
import { ChatСonfig } from './db';
import { GITLAB_TOKENS } from './main';

function initialState(): SessionData {
  return {
    keyCommand: null,
    userId: null,
    gitLabTokens: GITLAB_TOKENS,
    chatId: null,
    chatTitle: null,
  };
}

export class BotInstance {
  bot: Bot<MyContext>;
  commandDispatcherInstance;

  constructor({ bot }: { bot: Bot<MyContext> }) {
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
    this.joinAndLeaveChat();
  }

  joinAndLeaveChat() {
    this.bot.on('my_chat_member', (ctx) => {
      const chatId = String(ctx.chat.id);
      const chatTitle = ctx.chat?.title || chatId;
      const newStatus = ctx.myChatMember.new_chat_member.status;

      if (newStatus === 'member') {
        ctx.reply(
          'Привет, товарищи! Меня добавили в ваш чат, готова помогать за миску цифрового риса 🍚!',
        );

        ChatСonfig.create(chatId, chatTitle, (err) => {
          if (err) {
            console.error('Проблема при создание конфигурации чата', err);
          }
        });
      }

      if (newStatus === 'kicked' || newStatus === 'left') {
        ChatСonfig.delete(chatId);
        console.log(`Бота удалили из чата ${chatId}`);
      }
    });
  }

  initHears() {
    //============================================================
    // слушутели на MR
    //============================================================

    // git.russpass.dev gitlab.com — дергаем всех кто isActive
    this.bot.hears(
      new RegExp(`!!https://${process.env.BASE_URL}`),

      hearsActiveMR,
    );

    // дергаем тех кого добавили в гит idAssignees idReviewers
    this.bot.hears(
      new RegExp(`~https://${process.env.BASE_URL}`),
      hearsAssigneesReviewersMR,
    );
    // дергаем по пресету
    this.bot.hears(
      new RegExp(`!https://${process.env.BASE_URL}`),
      hearsPresetMR,
    );

    this.bot.hears('del-msg-bot', hearsDelMsgBot);
  }

  initInteractiveMenu() {
    //============================================================
    // команды интерактивного меню
    //============================================================

    this.bot.callbackQuery(KeyCommand.chatСonfig, commandMenuChat);

    // ====== editStatus ======

    this.bot.callbackQuery(
      KeyCommand.editStatusUser,
      (ctx: TCallbackQueryContext) =>
        commandShowListChat(ctx, 'chatTitle', 'Выберите чат проекта:'),
    );

    // Кнопки списков чатов
    this.bot.callbackQuery(/^chatTitle-\d/, (ctx: TCallbackQueryContext) => {
      const chatId = String(ctx.callbackQuery.data.split('-')[1]);
      const chatTitle = String(ctx.callbackQuery.data.split('-')[2]);

      ctx.session.chatId = `-${chatId}`;
      ctx.session.chatTitle = chatTitle;

      commandUserAction(ctx, 'editStatus');
      ctx.answerCallbackQuery();
    });

    this.bot.callbackQuery(/^editStatus-\d/, commandButtonEditUser);

    // ====== delete ======

    this.bot.callbackQuery(KeyCommand.delete, (ctx: TCallbackQueryContext) =>
      commandShowListChat(
        ctx,
        'chatDelete',
        'Выберите чат проекта, из которого хотите удалить пользователя.',
      ),
    );

    this.bot.callbackQuery(/^chatDelete-\d/, (ctx: TCallbackQueryContext) => {
      const chatId = String(ctx.callbackQuery.data.split('-')[1]);
      const chatTitle = String(ctx.callbackQuery.data.split('-')[2]);

      ctx.session.chatId = `-${chatId}`;
      ctx.session.chatTitle = chatTitle;

      commandUserAction(ctx, 'delete');
      ctx.answerCallbackQuery();
    });

    this.bot.callbackQuery(/^delete-\d/, commandButtonDeleteUser);

    // ======
    this.bot.callbackQuery(KeyCommand.updatePreset, commandUpdatePreset);

    this.bot.callbackQuery(KeyCommand.deletePreset, commandDeletePreset);

    this.bot.callbackQuery(KeyCommand.allUser, commandAllUser);

    // todo вынести в отдельные фукции yesAnswer noAnswer
    this.bot.callbackQuery(KeyCommand.yesAnswer, async (ctx) => {
      switch (ctx.session.keyCommand) {
        case KeyCommand.delete:
          await deleteUser(ctx.session.userId || 0);
          await commandUserAction(ctx, 'delete');
          break;
        case KeyCommand.deletePreset:
          await deletePreset(ctx);
          await commandUpdatePreset(ctx);
          break;
        default:
          console.error(
            `Комманда была не назначина в callbackQuery ${KeyCommand.yesAnswer}`,
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
          commandUserAction(ctx, 'delete');
          break;
        case KeyCommand.deletePreset:
          commandUpdatePreset(ctx);
          break;

        default:
          console.error(
            `Комманда была не назначина в callbackQuery ${KeyCommand.noAnswer}`,
          );
          break;
      }

      ctx.session.keyCommand = null;
      ctx.answerCallbackQuery();
    });

    this.bot.callbackQuery(/^setUser-\d/, (ctx: TCallbackQueryContext) => {
      const chatId = String(ctx.callbackQuery.data.split('-')[1]);
      const chatTitle = String(ctx.callbackQuery.data.split('-')[2]);

      ctx.session.chatId = `-${chatId}`;
      ctx.session.chatTitle = chatTitle;

      handleCommand(ctx, KeyCommand.setUser);
      ctx.answerCallbackQuery();
    });

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

    this.bot.command([KeyCommand.setUser], (ctx: MyContext) =>
      commandShowListChat(
        ctx,
        'setUser',
        'Выберите в какой проект добавить пользователя:',
      ),
    );

    this.bot.command([KeyCommand.setIdGitLab], async (ctx: MyContext) =>
      handleCommand(ctx, KeyCommand.setIdGitLab),
    );

    this.bot.command([KeyCommand.completedTasks], async (ctx: MyContext) =>
      commandCompletedTasks(ctx),
    );

    this.bot.command([KeyCommand.menu], async (ctx: MyContext) => {
      await ctx.reply('Выбирете пункт', { reply_markup: keyboardMenu });
    });

    this.bot.command([KeyCommand.createTasksListTEST], async (ctx: MyContext) =>
      handleCommand(ctx, KeyCommand.createTasksListTEST),
    );

    this.bot.command(
      [KeyCommand.createTasksListSTAGE],
      async (ctx: MyContext) =>
        handleCommand(ctx, KeyCommand.createTasksListSTAGE),
    );

    //============================================================
    // обработка сообщений после команд /
    //============================================================

    this.bot.on('message', async (ctx: MyContext) => {
      if (!ctx.session.keyCommand) return;
      const chatId = ctx.session?.chatId;
      const chatTitle = ctx.session?.chatTitle;

      switch (ctx.session.keyCommand) {
        case KeyCommand.setUser:
          this.commandDispatcherInstance.setUser(ctx, chatId, chatTitle);
          break;
        case KeyCommand.setIdGitLab:
          this.commandDispatcherInstance.setIdGitLab(ctx);
          break;
        case KeyCommand.createTasksListTEST:
          this.commandDispatcherInstance.createTasksList(ctx, 'test');
          break;
        case KeyCommand.createTasksListSTAGE:
          this.commandDispatcherInstance.createTasksList(ctx, 'stage');
          break;
      }
      ctx.session.keyCommand = null;
      ctx.session.chatId = null;
      ctx.session.chatTitle = null;
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
            replyError,
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
