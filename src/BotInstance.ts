import 'dotenv/config';
import { Bot, session } from 'grammy';
import { hydrate } from '@grammyjs/hydrate';

import { LIST_MY_COMMAND } from './command/constant';
import { hearsActiveMR, hearsDelMsgBot, hearsPresetMR } from './hears';
import { MyContext, SessionData, TCallbackQueryContext } from './type';
import { adminKeyboardMenu, userKeyboardMenu } from './keyboards/keyboard';
import { ChatСonfig } from './db';

import { addConfigChat, handlerAddConfigChat } from './module/chatConfig/add';
import { KeyCommand } from './constant/constant';
import { isAdminUser } from './helper/helper';
import { joinBot, leaveBot } from './module/joinAndLeaveChat/joinAndLeaveBot';
import { handlerDeleteUser, deleteUser } from './module/userManagement/delete';
import { commandShowListChat } from './module/chatList/createChatList';
import { handleSetUserToChat, setUser } from './module/userManagement/setUser';
import { createListUsers } from './module/userManagement/helper';
import { resetCompletedTasks } from './module/TaskService/resetCompletedTasks';
import { joinNewUserToChat } from './module/joinAndLeaveChat/joinNewUserToChat';
import { leaveUserToChat } from './module/joinAndLeaveChat/leaveUserToChat';
import { ErrorObserve } from './module/ErrorObserver/ErrorObserver';
import { handlerSelectChat } from './module/chatList/handlerSelectChat';
import { handleCommand } from './command/handleCommand';
import { handlerUpatePreset } from './module/userManagement/editPreset';
import { handlerEditStatusSendMrUser } from './module/userManagement/editStatusSendMr';

function initialState(): SessionData {
  return {
    keyCommand: null,
    userId: null,
    chatId: null,
    chatTitle: null,
    addConfigChat: null,
    filedUpdateBD: null,
    chatInternalId: null,
  };
}

export class BotInstance {
  bot: Bot<MyContext>;
  gitLabTokens: Record<string, string | null>;

  constructor({ bot }: { bot: Bot<MyContext> }) {
    this.bot = bot;
    this.gitLabTokens = {};

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
    this.createListGitLabTokens().then((tokens) => {
      this.gitLabTokens = tokens;
    });
    // шедулер в 00:00 очищает список выполненных задач У ВСЕХ!!!
    resetCompletedTasks();
  }

  // TODO переписть записывание токенов
  async createListGitLabTokens() {
    const listChat = await ChatСonfig.all();
    const res: Record<string, string | null> = {};

    listChat?.forEach((chat) => {
      res[chat.chatId] = chat.tokenGitLab;
    });

    return res;
  }

  joinAndLeaveChat() {
    this.bot.on('message:new_chat_members:is_bot', joinBot);

    this.bot.on('message:new_chat_members', joinNewUserToChat);

    this.bot.on('message:left_chat_member', leaveUserToChat);

    this.bot.on('my_chat_member', leaveBot);
  }

  initHears() {
    //============================================================
    // слушутели на MR
    //============================================================

    // git.russpass.dev gitlab.com дергаем всех кто isActive
    this.bot.hears(/!!https?:\/\/gitlab\.[^\s]+/i, (ctx) =>
      hearsActiveMR(ctx, this.gitLabTokens),
    );

    // дергаем по пресету
    this.bot.hears(new RegExp(`!https://git`), (ctx) =>
      hearsPresetMR(ctx, this.gitLabTokens),
    );

    this.bot.hears('del-msg-bot', hearsDelMsgBot);
  }

  initInteractiveMenu() {
    //============================================================
    // команды интерактивного меню
    //============================================================

    // ====== chatСonfig ======
    this.bot.callbackQuery(
      KeyCommand.chatСonfig,
      (ctx: TCallbackQueryContext) =>
        commandShowListChat({
          ctx,
          text: 'Выберите чат проекта для редактирования настроек:',
          action: 'editChatConfig',
        }),
    );
    // ======
    // Кнопки списков чатов
    this.bot.callbackQuery(/^selectChat:-?\d+/, handlerSelectChat);

    // ====== editStatusSendMR ======

    this.bot.callbackQuery(
      KeyCommand.editStatusSendMRUser,
      (ctx: TCallbackQueryContext) => {
        commandShowListChat({
          ctx,
          text: 'Выберите чат проекта для редактирования статуса пользователя:',
          action: 'editStatusSendMR',
        });
      },
    );

    this.bot.callbackQuery(/^editStatusSendMR:\d/, handlerEditStatusSendMrUser);

    // ====== delete ======

    this.bot.callbackQuery(KeyCommand.delete, (ctx: TCallbackQueryContext) =>
      commandShowListChat({
        ctx,
        text: 'Выберите чат проекта, из которого хотите удалить пользователя.',
        action: 'delete',
      }),
    );

    this.bot.callbackQuery(/^delete:\d/, (ctx: TCallbackQueryContext) =>
      handlerDeleteUser({
        ctx,
        text: 'Вы уверены, что хотите удалить этого пользователя',
        action: 'delete',
      }),
    );

    // ======

    this.bot.callbackQuery(/^add_config_chat:-?\d+/, handlerAddConfigChat);

    this.bot.callbackQuery(/^updatePreset:\d/, handlerUpatePreset);

    this.bot.callbackQuery(
      KeyCommand.updatePreset,
      (ctx: TCallbackQueryContext) =>
        commandShowListChat({
          ctx,
          text: 'Выберите чат проекта, в котором хотите обновить пресет.',
          action: 'updatePreset',
        }),
    );

    this.bot.callbackQuery(
      KeyCommand.deletePreset,
      (ctx: TCallbackQueryContext) =>
        commandShowListChat({
          ctx,
          text: 'Выберите чат проекта, в который хотите посмотреть пользователя',
          action: 'allUser',
        }),
    );

    this.bot.callbackQuery(KeyCommand.allUser, (ctx: TCallbackQueryContext) =>
      commandShowListChat({
        ctx,
        text: 'Выберите чат проекта, в который хотите посмотреть пользователя',
        action: 'allUser',
      }),
    );

    // todo вынести в отдельные фукции yesAnswer noAnswer
    this.bot.callbackQuery(/^yes_answer:\d/, async (ctx) => {
      const id = Number(ctx.callbackQuery.data.split(':')[1]);
      const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);
      const action = String(ctx.callbackQuery.data.split(':')[3]);

      switch (action) {
        case KeyCommand.delete:
          await deleteUser(id);
          await createListUsers(ctx, 'delete', chatInternalId);
          break;
        default:
          console.error(
            `Комманда была не назначина в callbackQuery ${KeyCommand.yesAnswer}`,
          );
          break;
      }

      ctx.answerCallbackQuery();
    });

    this.bot.callbackQuery(/^no_answer:\d/, async (ctx) => {
      const chatInternalId = Number(ctx.callbackQuery.data.split(':')[1]);
      const action = String(ctx.callbackQuery.data.split(':')[2]);
      switch (action) {
        case KeyCommand.delete:
          createListUsers(ctx, 'delete', chatInternalId);
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

    // это создание юзера когда его добавляют в чат
    this.bot.callbackQuery(/^setUser:@*/, handleSetUserToChat);

    this.bot.callbackQuery(KeyCommand.backToMenu, async (ctx) => {
      const keybord = isAdminUser(ctx.from?.id || 0)
        ? adminKeyboardMenu
        : userKeyboardMenu;

      ctx.callbackQuery.message?.editText('Выбирете пункт меню', {
        reply_markup: keybord,
      });
      ctx.answerCallbackQuery();
    });
  }

  initCommands() {
    //============================================================
    // команды через /
    //============================================================

    this.bot.command([KeyCommand.setUser], async (ctx: MyContext) => {
      if (ctx.chat?.type !== 'private') {
        await ctx.reply(
          'Эта команда работает только в личных сообщениях с ботом.',
        );
        return;
      }

      if (!isAdminUser(ctx.from?.id || 0)) {
        await ctx.reply(
          'Вы не можете использовать эту команду, так как не являетесь администратором бота. Пожалуйста, напишите администратору.',
        );
        return;
      }

      commandShowListChat({
        ctx,
        modKeybord: 'reply',
        text: 'Выберите чат проекта для добавления пользователя.',
        action: 'setUser',
      });
    });

    this.bot.command([KeyCommand.completedTasks], async (ctx: MyContext) =>
      commandShowListChat({
        ctx,
        text: 'Выберите чат проекта, в который посмотреть выполненные задачи.',
        action: 'completedTasks',
        modKeybord: 'reply',
      }),
    );

    this.bot.command([KeyCommand.menu], async (ctx: MyContext) => {
      if (ctx.chat?.type !== 'private') {
        ctx.reply('Эта команда работает только в личных сообщениях с ботом.');
        return;
      }

      const keybord = isAdminUser(ctx.from?.id || 0)
        ? adminKeyboardMenu
        : userKeyboardMenu;

      await ctx.reply('Выбирете пункт', { reply_markup: keybord });
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

    this.bot.on('message:text', async (ctx: MyContext) => {
      if (!ctx.session.keyCommand) return;

      const chatId = ctx.session?.chatId || null;
      const chatInternalId = ctx.session?.chatInternalId || null;

      const chatTitle = ctx.session?.chatTitle;

      const filedUpdateBD = ctx.session?.filedUpdateBD as keyof ChatСonfig;

      switch (ctx.session.keyCommand) {
        case KeyCommand.setUser:
          setUser(ctx, Number(chatInternalId), chatTitle || '');
          break;
        case KeyCommand.addConfigChat:
          addConfigChat(ctx, chatId, filedUpdateBD);
          return;
        default:
          console.error(
            `Комманда была не назначина в message:text ${ctx.session.keyCommand}`,
          );
          break;
      }

      ctx.session.chatInternalId = null;
      ctx.session.keyCommand = null;
      ctx.session.chatId = null;
      ctx.session.chatTitle = null;
    });
  }

  initErrorObserver() {
    //============================================================
    // Обработка ошибок
    //============================================================

    this.bot.catch(ErrorObserve);
  }
}
