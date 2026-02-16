import 'dotenv/config';
import { Bot, GrammyError, HttpError, session } from 'grammy';
import { hydrate } from '@grammyjs/hydrate';
import {
  handleCommand,
  commandAllUser,
  commandUpdatePreset,
  commandDeletePreset,
  deletePreset,
  commandButtonPreset,
  CommandDispatcher,
  commandCompletedTasks,
} from './command';
import { LIST_MY_COMMAND } from './command/constant';
import { hearsPresetMR, hearsActiveMR, hearsDelMsgBot } from './hears';
import { MyContext, SessionData, TCallbackQueryContext } from './type';
import { adminKeyboardMenu, userKeyboardMenu } from './keyboards/keyboard';
import { ChatСonfig } from './db';

import { addConfigChat } from './module/chatConfig/add';
import { KeyCommand, LIST_FIELD_CHAT_CONFIG } from './constant/constant';
import { isAdminUser } from './helper/helper';
import { actionEditConfig } from './module/chatConfig/edit';
import { joinAndLeaveBot } from './module/joinAndLeaveChat/joinAndLeaveBot';
import { getAllChats } from './db/helpers';
import {
  handlerDeleteUser,
  deleteUser,
  handlerDeleteUserFromChat,
  deleteChatMebers,
} from './module/userManagement/delete';
import { commandShowListChat } from './module/chatList/createChatList';
import { handleSetUserToChat, setUser } from './module/userManagement/setUser';
import { createListUsers } from './module/userManagement/helper';
import { handlerEditStatusSendMrUser } from './module/userManagement/EditStatusSendMr';
import { handlerAddUserToChat } from './module/userManagement/handlerAddUserToChat';

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
  commandDispatcherInstance;
  gitLabTokens: Record<string, string | null>;

  constructor({ bot }: { bot: Bot<MyContext> }) {
    this.bot = bot;
    this.gitLabTokens = {};

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
    this.createListGitLabTokens().then((tokens) => {
      this.gitLabTokens = tokens;
    });
  }

  // TODO переписть записывание токенов
  async createListGitLabTokens() {
    const listChat = await getAllChats();
    const res: Record<string, string | null> = {};

    listChat?.forEach((chat) => {
      res[chat.chatId] = chat.tokenGitLab;
    });

    return res;
  }

  joinAndLeaveChat() {
    this.bot.on('my_chat_member', joinAndLeaveBot);

    // TODO допилить чтоб проверял есть ли в базе, и если есть добял только id чата в колонку
    // this.bot.on('message:new_chat_members', joinNewUser);
  }

  initHears() {
    //============================================================
    // слушутели на MR
    //============================================================

    // git.russpass.dev gitlab.com — дергаем всех кто isActive
    this.bot.hears(/!!https?:\/\/gitlab\.[^\s]+/i, (ctx) =>
      hearsActiveMR(ctx, this.gitLabTokens),
    );

    // дергаем по пресету
    // this.bot.hears(new RegExp(`!https://git`), hearsPresetMR);

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
    this.bot.callbackQuery(
      /^selectChat:-?\d+/,
      (ctx: TCallbackQueryContext) => {
        const chatInternalId = Number(ctx.callbackQuery.data.split(':')[1]);

        const chatId = Number(ctx.callbackQuery.data.split(':')[2]);

        const chatTitle = String(ctx.callbackQuery.data.split(':')[3]);

        const action = String(ctx.callbackQuery.data.split(':')[4]);

        // TODO сделать уникалтные ключи и потом удалять
        ctx.session.chatInternalId = chatInternalId;
        ctx.session.chatId = chatId;
        ctx.session.chatTitle = chatTitle;

        switch (action) {
          case 'editStatusSendMR':
            createListUsers(ctx, 'editStatusSendMR', chatInternalId);
            break;
          case 'delete':
            createListUsers(ctx, 'delete', chatInternalId);
            break;
          case 'deleteFromChat':
            createListUsers(ctx, 'deleteFromChat', chatInternalId);
            break;
          case 'setUser':
            handleCommand(ctx, KeyCommand.setUser);
            break;
          case 'addUserToChat':
            createListUsers(ctx, 'addUserToChat', chatInternalId);
            break;
          case 'completedTasks':
            commandCompletedTasks(ctx, chatInternalId);
            break;
          case 'editChatConfig':
            actionEditConfig(
              ctx,
              `Вы выбрали чат: ${chatTitle}. Что вы хотите отредактировать?`,
              chatId,
            );
          default:
            break;
        }

        ctx.answerCallbackQuery();
      },
    );

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

    this.bot.callbackQuery(
      KeyCommand.deleteFromChat,
      (ctx: TCallbackQueryContext) =>
        commandShowListChat({
          ctx,
          text: 'Выберите чат проекта откуда надо удлаить польвателя ?',
          action: 'deleteFromChat',
        }),
    );

    this.bot.callbackQuery(/^deleteFromChat:\d/, (ctx: TCallbackQueryContext) =>
      handlerDeleteUser({
        ctx,
        text: 'Вы уверены, что хотите удалить этого пользователя из чата ? ',
        action: 'deleteFromChat',
      }),
    );

    // ======

    this.bot.callbackQuery(
      KeyCommand.addUserToChat,
      (ctx: TCallbackQueryContext) =>
        commandShowListChat({
          ctx,
          text: 'Выберите чат проекта, в который хотите добавить пользователя.',
          action: 'addUserToChat',
        }),
    );

    this.bot.callbackQuery(/^addUserToChat:\d/, handlerAddUserToChat);

    this.bot.callbackQuery(/^add_config_chat:-?\d+/, async (ctx) => {
      const chatId = String(ctx.callbackQuery.data.split(':')[1]);

      const filedBD = String(
        ctx.callbackQuery.data.split(':')[2],
      ) as keyof ChatСonfig;

      (await ctx.reply(
        `Введите ${LIST_FIELD_CHAT_CONFIG[filedBD]} для этого чата.`,
      ),
        (ctx.session.keyCommand = KeyCommand.addConfigChat));

      ctx.session.chatId = Number(chatId);
      ctx.session.filedUpdateBD = filedBD;
    });

    this.bot.callbackQuery(KeyCommand.updatePreset, commandUpdatePreset);

    this.bot.callbackQuery(KeyCommand.deletePreset, commandDeletePreset);

    this.bot.callbackQuery(KeyCommand.allUser, commandAllUser);

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
        case KeyCommand.deleteFromChat:
          await deleteChatMebers(id, chatInternalId);
          await createListUsers(ctx, 'deleteFromChat', chatInternalId);
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

      ctx.answerCallbackQuery();
    });

    this.bot.callbackQuery(/^no_answer:\d/, async (ctx) => {
      const chatInternalId = Number(ctx.callbackQuery.data.split(':')[1]);
      const action = String(ctx.callbackQuery.data.split(':')[2]);
      switch (action) {
        case KeyCommand.delete:
          createListUsers(ctx, 'delete', chatInternalId);
          break;
        case KeyCommand.deleteFromChat:
          createListUsers(ctx, 'deleteFromChat', chatInternalId);
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

    this.bot.callbackQuery(/^preset:@*/, commandButtonPreset);

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
        case KeyCommand.createTasksListTEST:
          this.commandDispatcherInstance.createTasksList(ctx, 'test');
          break;
        case KeyCommand.createTasksListSTAGE:
          this.commandDispatcherInstance.createTasksList(ctx, 'stage');
          break;
        case KeyCommand.addConfigChat:
          addConfigChat(ctx, chatInternalId, filedUpdateBD);
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
