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
} from './command';
import { LIST_MY_COMMAND } from './command/constant';
import { hearsPresetMR, hearsActiveMR, hearsDelMsgBot } from './hears';
import { MyContext, SessionData, TCallbackQueryContext } from './type';
import { adminKeyboardMenu, userKeyboardMenu } from './keyboards/keyboard';
import { ChatСonfig, Users } from './db';
import { GITLAB_TOKENS } from './main';
import { addConfigChat } from './module/chatConfig/add';
import { KeyCommand, LIST_FIELD_CHAT_CONFIG } from './constant/constant';
import { isAdminUser } from './helper/helper';
import { actionEditConfig } from './module/chatConfig/edit';
import { joinAndLeaveBot } from './module/joinAndLeaveChat/joinAndLeaveBot';
import { joinNewUser } from './module/joinAndLeaveChat/joinNewUser';
import { findUserById, findUsersByName, getAllChats } from './db/helpers';

function initialState(): SessionData {
  return {
    keyCommand: null,
    userId: null,
    chatId: null,
    chatTitle: null,
    addConfigChat: null,
    filedUpdateBD: null,
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
    this.bot.hears(new RegExp(`!!https://git`), (ctx) =>
      hearsActiveMR(ctx, this.gitLabTokens),
    );

    // дергаем по пресету
    this.bot.hears(new RegExp(`!https://git`), hearsPresetMR);

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
    this.bot.callbackQuery(/^selectChat-\d/, (ctx: TCallbackQueryContext) => {
      const chatId = `-${ctx.callbackQuery.data.split('-')[1]}`;
      const chatTitle = String(ctx.callbackQuery.data.split('-')[2]);
      const action = String(ctx.callbackQuery.data.split('-')[3]);

      ctx.session.chatId = chatId;
      ctx.session.chatTitle = chatTitle;

      switch (action) {
        case 'editStatus':
          commandUserAction(ctx, 'editStatus');
          break;
        case 'delete':
          commandUserAction(ctx, 'delete');
          break;
        case 'setUser':
          handleCommand(ctx, KeyCommand.setUser);
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
    });

    // ====== editStatus ======

    this.bot.callbackQuery(
      KeyCommand.editStatusUser,
      (ctx: TCallbackQueryContext) =>
        commandShowListChat({
          ctx,
          text: 'Выберите чат проекта для редактирования статуса пользователя:',
          action: 'editStatus',
        }),
    );

    this.bot.callbackQuery(/^editStatus-\d/, commandButtonEditUser);

    // ====== delete ======

    this.bot.callbackQuery(KeyCommand.delete, (ctx: TCallbackQueryContext) =>
      commandShowListChat({
        ctx,
        text: 'Выберите чат проекта, из которого хотите удалить пользователя.',
        action: 'delete',
      }),
    );

    this.bot.callbackQuery(/^delete-\d/, commandButtonDeleteUser);

    // ======
    this.bot.callbackQuery(/^add_config_chat-\d/, async (ctx) => {
      const chatId = String(ctx.callbackQuery.data.split('-')[1]);
      const filedBD = String(
        ctx.callbackQuery.data.split('-')[2],
      ) as keyof ChatСonfig;

      (await ctx.reply(
        `Введите ${LIST_FIELD_CHAT_CONFIG[filedBD]} для этого чата.`,
      ),
        (ctx.session.keyCommand = KeyCommand.addConfigChat));

      ctx.session.chatId = `-${chatId}`;
      ctx.session.filedUpdateBD = filedBD;
    });

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

    this.bot.callbackQuery(/^preset-@*/, commandButtonPreset);

    this.bot.callbackQuery(
      /^setUser-@*/,
      async (ctx: TCallbackQueryContext) => {
        const chatId = `-${ctx.callbackQuery.data.split('-')[1]}`;
        const name = ctx.callbackQuery.data.split('-')[2];
        const user = await findUserById(`@${name}`, 'users', 'name');
        const userChatIds = user?.chatIds ? JSON.parse(user.chatIds) : [];

        if (!user) {
          Users.create([`@${name}`], chatId, 'users', (err) => {
            if (err) return;
          });
        }

        if (user && userChatIds && !userChatIds.includes(chatId)) {
          Users.updateChatIdsForUsers(
            [
              {
                id: user.id,
                chatIds: JSON.stringify([...userChatIds, chatId]),
              },
            ],
            (err, res) => {
              if (err) {
                console.error(err);
              } else {
                console.log(`Обновлено записей: ${res?.updated}`);
              }
            },
          );
        }

        ctx.answerCallbackQuery();
      },
    );

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

    this.bot.command([KeyCommand.setIdGitLab], async (ctx: MyContext) =>
      handleCommand(ctx, KeyCommand.setIdGitLab),
    );

    this.bot.command([KeyCommand.completedTasks], async (ctx: MyContext) =>
      commandCompletedTasks(ctx),
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

      const chatTitle = ctx.session?.chatTitle;
      const filedUpdateBD = ctx.session?.filedUpdateBD as keyof ChatСonfig;

      switch (ctx.session.keyCommand) {
        case KeyCommand.setUser:
          this.commandDispatcherInstance.setUser(ctx, chatId, chatTitle || '');
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
        case KeyCommand.addConfigChat:
          addConfigChat(ctx, chatId, filedUpdateBD);
          return;
        default:
          console.error(
            `Комманда была не назначина в message:text ${ctx.session.keyCommand}`,
          );
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
