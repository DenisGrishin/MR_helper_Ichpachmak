import { User, IUser } from './db/db';
import { findUsersBd, findUser } from './db/helpers';
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
  async enabelUser(msgUserNames: string[] | null, ctx: Context): Promise<void> {
    if (!msgUserNames) {
      this.showErrorMsg('Отправьте теги кого хотите активировать.', ctx);
      return;
    }

    const { notFindUsersDb, findUsersDb } = await findUsersBd(msgUserNames);

    const alreadyActivated = findUsersDb
      .filter((el) => el.isActive)
      .map((el) => el.name);

    const needToActivate = findUsersDb
      .map((el) => {
        if (!alreadyActivated.includes(el.name)) return el;
      })
      .filter((el): el is IUser => el !== undefined);

    if (needToActivate.length) {
      needToActivate.forEach((user) => {
        User.update(
          user.id,
          { name: user.name, isActive: 1, idGitLab: user.idGitLab },
          (err) => {
            if (err) console.error(err);
          }
        );
      });
    }

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: needToActivate.map((el) => el.name),
      warning: alreadyActivated,
      failure: notFindUsersDb,
      textSuccess: `${TEXT_MSG_1} стали активными`,
      textWarning: `${TEXT_MSG_1} уже активны`,
      textFailure: `${TEXT_MSG_1} не существуют в базе`,
      ctx,
    });
  }

  async disabledUser(
    msgUserNames: string[] | null,
    ctx: Context
  ): Promise<void> {
    if (!msgUserNames) {
      this.showErrorMsg('Отправьте теги кого хотите деактивировать.', ctx);
      return;
    }

    const { notFindUsersDb, findUsersDb } = await findUsersBd(msgUserNames);

    const alreadyDeactivated = findUsersDb
      .filter((el) => !el.isActive)
      .map((el) => el.name);

    const needsToDeactivated = findUsersDb
      .filter((el) => el.isActive)
      .map((el) => el);

    if (needsToDeactivated.length) {
      needsToDeactivated.forEach((user) => {
        User.update(
          user.id,
          { name: user.name, isActive: 0, idGitLab: user.idGitLab },
          (err) => {
            if (err) console.error(err);
          }
        );
      });
    }

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: needsToDeactivated.map((el) => el.name),
      warning: alreadyDeactivated,
      failure: notFindUsersDb,
      textSuccess: `${TEXT_MSG_1} стали неактивными`,
      textWarning: `${TEXT_MSG_1} уже неактивны`,
      textFailure: `${TEXT_MSG_1} не существуют в базе`,
      ctx,
    });
  }

  async setUser(msgUserNames: string[] | null, ctx: Context): Promise<void> {
    if (!msgUserNames) {
      this.showErrorMsg('Отправьте теги кого хотите добавить в базу.', ctx);
      return;
    }

    const { notFindUsersDb, namesBd } = await findUsersBd(msgUserNames);

    notFindUsersDb.forEach((name) => {
      User.create({ name, idGitLab: 0 }, (err) => {
        if (err) return;
      });
    });

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: notFindUsersDb,
      warning: [],
      failure: namesBd,
      textSuccess: `${TEXT_MSG_1} были добавлены в базу`,
      textFailure: `${TEXT_MSG_1} уже существуют в базе`,
      ctx,
    });
  }

  async deleteUser(msgUserNames: string[] | null, ctx: Context): Promise<void> {
    if (!msgUserNames) {
      this.showErrorMsg('Отправьте теги кого хотите удалить с базы.', ctx);
      return;
    }

    const { notFindUsersDb, findUsersDb, namesBd } = await findUsersBd(
      msgUserNames
    );

    if (findUsersDb.length) {
      findUsersDb.forEach((user) => {
        User.delete(user.id, (err) => {
          if (err) console.error('Delete bd', err);
        });
      });
    }

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: namesBd,
      warning: [],
      failure: notFindUsersDb,
      textSuccess: `${TEXT_MSG_1} удалены из базы`,
      textFailure: `${TEXT_MSG_1} не существуют в базе`,
      ctx,
    });
  }

  async setIdGitLab(msgNameId: string[], ctx: Context): Promise<void> {
    const [name, id] = msgNameId;
    const user = await findUser(name);

    if (user) {
      User.updateGitLabId(user.id, Number(id), (err) => {
        if (err) console.error(err);
      });
    }

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: user ? [name] : [],
      warning: [],
      failure: !user ? [name] : [],
      textSuccess: `Этому пользователю был добавлен id Git lab: ${id} тег`,
      textFailure: `${TEXT_MSG_1} не существуют в базе`,
      ctx,
    });
  }

  async updatePreset(
    msgUserNames: string[] | null,
    ctx: Context
  ): Promise<void> {
    const authorMsg = await findUser(`@${ctx.message!.from!.username}`);

    const { notFindUsersDb, namesBd } = await findUsersBd(msgUserNames || []);

    if (namesBd.length && authorMsg) {
      User.updatePreset(authorMsg.id, JSON.stringify(namesBd), (err) => {
        if (err) console.error(err);
      });
    }

    await this.messageBot({
      messageId: ctx.msg!.message_id,
      success: namesBd,
      warning: notFindUsersDb,
      failure: [' '],
      textSuccess: `Вы обновили свой пресет`,
      textWarning: `${TEXT_MSG_1} не существуют в базе`,
      textFailure: 'Отправьте теги кого хотите добавить в пресет',
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
