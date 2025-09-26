import { User, IUser } from './db/db';
import { getNameBd, findUser } from './db/helpers';
import { Context } from 'grammy';

const TEXT_MSG_1 = 'Эти(-от) пользователи(-ль)';

interface IMessageBotArgs {
  messageId: number;
  success: string[];
  warning: string[];
  failure: string[];
  ctx: Context;
  textSuccess?: string;
  textFailure?: string;
  textWarning?: string;
}

export class CommandDispatcher {
  async setUser(msgUserNames: string[] | null, ctx: Context): Promise<void> {
    if (!msgUserNames) {
      this.showErrorMsg('Отправьте теги кого хотите добавить в базу.', ctx);
      // TODO вызвать еще разк команду чтоб добавить людей
      return;
    }

    const { notFindUsersDb, usersNameBd } = await getNameBd(msgUserNames);

    User.create(notFindUsersDb, (err) => {
      if (err) return;
    });

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: notFindUsersDb,
      warning: [],
      failure: usersNameBd,
      textSuccess: `${TEXT_MSG_1} были добавлены в базу`,
      textFailure: `${TEXT_MSG_1} уже существуют в базе`,
      ctx,
    });
  }

  async setIdGitLab(msgNameId: string[], ctx: Context): Promise<void> {
    const [name, id] = msgNameId;
    const users = await findUser([name], 'name');

    if (users?.length) {
      User.updateGitLabId(users[0].id, Number(id), (err) => {
        if (err) console.error(err);
      });
    }

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: users ? [name] : [],
      warning: [],
      failure: !users ? [name] : [],
      textSuccess: `Этому пользователю был добавлен id Git lab: ${id} тег`,
      textFailure: `${TEXT_MSG_1} не существуют в базе`,
      ctx,
    });
  }

  async showErrorMsg(msgError: string, ctx: Context): Promise<void> {
    await ctx.reply(`❌ ${msgError}`, {
      reply_parameters: { message_id: ctx.msg!.message_id },
    });
  }

  async messageBot({
    messageId,
    success,
    warning,
    failure,
    ctx,
    textSuccess = '',
    textFailure = '',
    textWarning = '',
  }: IMessageBotArgs): Promise<void> {
    const isWarning = !!warning.length;
    const isSuccess = !!success.length;
    const isFailure = !!failure.length;

    const messageSuccessNameDb = isSuccess
      ? `✅ ${textSuccess}: ${success.join(', ')}`
      : '';

    const messageWarningNameDb = isWarning
      ? `⚠️ ${textWarning}: ${warning.join(', ')}`
      : '';

    const messageFailureNameDb = isFailure
      ? `❌ ${textFailure}: ${failure.join(', ')}`
      : '';

    await ctx.reply(
      `${messageSuccessNameDb}\n\n${messageWarningNameDb}\n\n${messageFailureNameDb}`,
      {
        reply_parameters: { message_id: messageId },
      }
    );
  }
}
