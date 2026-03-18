import { logger } from '../config';
import { ChatСonfig, Users } from '../db';
import { ChatMembers } from '../db/chatMembers';

export const isAdminMember = async (name: string) => {
  const author = await Users.findUser(`@${name}`, 'name', () => {});
  const chat = await ChatСonfig.findByTelegramId(-1);

  const authorChatMember = await ChatMembers.findChatMember(
    author.id,
    chat.id,
    ['isAdmin'],
  );

  logger.info({
    msg: 'Проверка прав администратора',
    username: name,
    isAdmin: authorChatMember?.isAdmin === 1,
    function: 'isAdminUser',
  });

  return authorChatMember?.isAdmin === 1;
};

/**
 * Проверяет, является ли статус пользователя участником чата
 * @param {string} status - Статус пользователя в чате
 * @returns {boolean}
 */
export function isMemberStatus(status: string): boolean {
  return ['member', 'administrator', 'creator'].includes(status);
}

/**
 * Проверяет, является ли статус пользователя администраторским
 * @param {string} status - Статус пользователя в чате
 * @returns {boolean}
 */
export function isAdminStatus(status: string): boolean {
  return ['creator', 'administrator'].includes(status);
}
