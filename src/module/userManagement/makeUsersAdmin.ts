import { ChatСonfig, Users } from '../../db';
import { ChatMembers } from '../../db/chatMembers';
import { MyContext } from '../../type';
import { logger } from '../../config';
import { isAdminStatus } from '../../helper/helper';
import { Contact } from 'grammy/types';
import { Context } from 'grammy';

export const makeUsersAdmin = async (ctx: MyContext) => {
  try {
    logger.info({
      msg: 'НАЧАЛО: makeUsersAdmin',
      chatId: ctx.chat?.id,
      chatType: ctx.chat?.type,
      function: 'makeUsersAdmin',
    });

    if (!ctx.chat || ctx.chat.type === 'private') {
      logger.warn({
        msg: 'Команда может использоваться только в групповых чатах',
        chatId: ctx.chat?.id,
        chatType: ctx.chat?.type,
        function: 'makeUsersAdmin',
      });
      await ctx.reply(
        'Эту команду можно использовать только в групповых чатах.',
      );
      return;
    }

    logger.info({
      msg: 'Чат валидный',
      chatId: ctx.chat.id,
      chatType: ctx.chat.type,
      function: 'makeUsersAdmin',
    });

    const admins = await ctx.api.getChatAdministrators(ctx.chat.id);
    const adminNames = admins.map((admin) => `@${admin.user.username}`);

    logger.info({
      msg: 'Получены администраторы из Telegram API',
      chatId: ctx.chat.id,
      adminsCount: admins.length,
      adminNames,
      function: 'makeUsersAdmin',
    });

    const chatConfig = await ChatСonfig.findByTelegramId(ctx.chat.id);

    if (!chatConfig) {
      logger.error({
        msg: 'Чат не найден в базе данных',
        chatId: ctx.chat.id,
        function: 'makeUsersAdmin',
      });
      await ctx.reply('Чат не найден в базе данных.');
      return;
    }

    logger.info({
      msg: 'Чат найден в базе данных',
      chatId: ctx.chat.id,
      chatInternalId: chatConfig.id,
      chatTitle: chatConfig.chatTitle,
      function: 'makeUsersAdmin',
    });

    const users = await Users.findUsersByNames(adminNames);

    logger.info({
      msg: 'Поиск пользователей в таблице users',
      searchNames: adminNames,
      foundUsers: users.map((u) => ({ id: u.id, name: u.name })),
    });

    const userIds = users.map((u) => u.id);

    logger.info({
      msg: 'Поиск записей в chatMembers',
      userIds,
      chatInternalId: chatConfig.id,
      function: 'makeUsersAdmin',
    });

    const systemChat = await ChatСonfig.findByTelegramId(-1);

    const result = await ChatMembers.updateFieldByIds(
      userIds,
      chatConfig.id,
      'isAdmin',
      1,
    );

    await ChatMembers.createChatMembers(userIds, systemChat.id, 1);

    logger.info({
      msg: 'Обновление статуса администраторов завершено',
      updatedCount: result.updated,
      userIds,
      chatInternalId: chatConfig.id,
      function: 'makeUsersAdmin',
    });

    await ctx.reply(`✅ Обновлено ${result.updated} администраторов`);
  } catch (error) {
    logger.error({
      msg: 'Ошибка в функции makeUsersAdmin',
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      chatId: ctx.chat?.id,
      function: 'makeUsersAdmin',
    });

    await ctx.reply('❌ Произошла ошибка при обновлении администраторов.');
  }
};

export const handleChatMemberStatus = async (ctx: Context) => {
  const update = ctx.chatMember;

  if (!update) {
    return;
  }

  const { old_chat_member: oldMember, new_chat_member: newMember } = update;
  const user = newMember.user;

  if (user.is_bot) {
    return;
  }

  const wasAdmin = isAdminStatus(oldMember.status);
  const isNowAdmin = isAdminStatus(newMember.status);

  logger.info({
    msg: 'chat_member событие',
    username: user.username,
    wasAdmin,
    isNowAdmin,
    function: 'handleChatMemberStatus',
  });

  const memberUser = await Users.findUser(
    `@${newMember.user.username}`,
    'name',
    () => {},
  );

  const systemPrivateChat = await ChatСonfig.findByTelegramId(-1);

  if (!memberUser) {
    logger.error({
      msg: 'Пользователь не найден в БД',
      username: user.username,
      function: 'handleChatMemberStatus',
    });

    await ctx.reply(
      `Пользователь @${newMember.user.username} не найден в базе данных. Его нужно добавить в базу данных.`,
    );
    return;
  }

  if (isNowAdmin && !wasAdmin) {
    logger.info({
      msg: 'Пользователь стал админом',
      username: user.username,
      userInternalId: memberUser.id,
      function: 'handleChatMemberStatus',
    });

    await ChatMembers.createChatMembers(
      [memberUser.id],
      systemPrivateChat.id,
      1,
    );
  }

  if (!isNowAdmin && wasAdmin) {
    logger.info({
      msg: 'Пользователь перестал быть админом',
      username: user.username,
      userInternalId: memberUser.id,
      function: 'handleChatMemberStatus',
    });

    await ChatMembers.deleteChatMember(memberUser.id, systemPrivateChat.id);
  }
};
