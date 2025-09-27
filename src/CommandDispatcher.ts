import { User } from './db/db';
import { getNamesBd, findUsersByName } from './db/helpers';
import type { Context } from 'grammy';

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

    const { notFindUsersDb, usersNameBd } = await getNamesBd(msgUserNames);

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

  async setIdGitLab(ctx: Context) {
    const msg = ctx.message!.text!;
    const msgGitId = Number(msg.split(' ').filter((el) => !!el)[1]);
    const tags = msg.match(/@\w+/g);

    if (!tags) throw new Error('Вы не передали тег');

    if (isNaN(msgGitId)) {
      throw new Error('Некорректный GitLab ID');
    }

    const users = await findUsersByName(tags);

    const { id } = users[0];

    User.updateGitLabId(id, Number(msgGitId), (err) => {
      if (err) console.error(err);
    });

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: users ? tags : [],
      warning: [],
      failure: !users ? tags : [],
      textSuccess: `Этому пользователю был добавлен id Git lab: ${msgGitId} тег`,
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
