import { IUser } from '../db';

export const findUsersInCurrentChat = (chatId: string, listUsers: IUser[]) => {
  if (!chatId) return [];

  return listUsers.filter((u) => JSON.parse(u.chatIds).includes(chatId));
};
