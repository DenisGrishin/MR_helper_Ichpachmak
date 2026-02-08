import { LIST_ID_USER_ADMIN } from '../constant/constant';
import { IUser } from '../db';

export const findUsersInCurrentChat = (chatId: string, listUsers: IUser[]) => {
  if (!chatId) return [];

  return listUsers.filter((u) => JSON.parse(u.chatIds).includes(chatId));
};

export const isAdminUser = (userId: number) => {
  return LIST_ID_USER_ADMIN.includes(userId);
};
