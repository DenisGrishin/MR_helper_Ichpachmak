import { LIST_ID_USER_ADMIN } from '../constant/constant';

export const isAdminUser = (userId: number) => {
  return LIST_ID_USER_ADMIN.includes(userId);
};
