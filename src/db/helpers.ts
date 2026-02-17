import { ChatСonfig } from './chatConfig/chatСonfig';
import { IUser, NameTableBD, Users } from './users';

export function getAllUsers(): Promise<IUser[]> {
  try {
    const res = Users.all();

    return res;
  } catch (error) {
    console.error('Ошибка', error);
    throw error;
  }
}

export const getAllChats = () => {
  try {
    const res = ChatСonfig.all();

    return res;
  } catch (error) {
    console.error('Ошибка', error);
    throw error;
  }
};

export const findUsersByName = async (
  values: string[],
  chatInternalId: number,
) => {
  try {
    const res = await Users.findUsersByName(values, chatInternalId);

    return res;
  } catch (error) {
    console.error('Ошибка', error);
    throw error;
  }
};
// todo доделать чтоб искало по тегу @username а не по имени username

export async function syncUsersWithDb(
  chatInternalId: number,
  users?: string[],
) {
  const findUsersDb: any = await findUsersByName(users || [], chatInternalId);

  const usersNameBd = findUsersDb?.map((user: any) => user.name);

  const notFindUsersBd = users?.filter((name) => !usersNameBd?.includes(name));

  if (notFindUsersBd?.length) {
    Users.create(notFindUsersBd, Number(chatInternalId), (err: any) => {
      if (err) return;
    });
  }

  return { notFindUsersBd, usersNameBd };
}
