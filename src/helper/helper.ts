import { LIST_ID_USER_ADMIN } from '../constant/constant';
import { IUser } from '../db';

// TODO Возможно удлать надо
export const findUsersInCurrentChat = (chatId: number, listUsers: IUser[]) => {
  if (!chatId) return [];

  return listUsers.filter((u) => JSON.parse(u.chatIds).includes(chatId));
};

export const isAdminUser = (userId: number) => {
  return LIST_ID_USER_ADMIN.includes(userId);
};
