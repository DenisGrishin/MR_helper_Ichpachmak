import { logger } from '../config';
import { Users } from '../db';
import { ChatMembers } from '../db/chatMembers';

export const isAdminUser = async (name: string) => {
  const author = await Users.findUser(`@${name}`, 'name', () => {});

  const authorChatMember = await ChatMembers.findChatMember(author.id, -1);

  logger.info({
    msg: 'Проверка прав администратора',
    username: name,
    isAdmin: authorChatMember?.isAdmin === 1,
    function: 'isAdminUser',
  });

  return authorChatMember?.isAdmin === 1;
};
