import { ChatСonfig } from './chatConfig/chatСonfig';
import { IUser, NameTableBD, Users } from './users';

export function getAllUsers(): Promise<IUser[]> {
  try {
    const res = Users.all('users');

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
): Promise<IUser[]> => {
  try {
    const res = await Users.findUsersByName(values, chatInternalId);

    return res;
  } catch (error) {
    console.error('Ошибка', error);
    throw error;
  }
};
// todo доделать чтоб искало по тегу @username а не по имени username
export const findUserById = async (
  id: number | string,
  nameTable: NameTableBD,
  column: 'id' | 'name' = 'id',
): Promise<IUser | undefined> => {
  try {
    const res = await Users.findUserById(id, nameTable, column);

    return res;
  } catch (error) {
    console.error('Ошибка', error);
  }
};

export async function syncUsersWithDb(
  chatInternalId: number,
  users?: string[],
) {
  const findUsersDb = await findUsersByName(users || [], chatInternalId);

  const usersNameBd = findUsersDb?.map((user) => user.name);

  const notFindUsersBd = users?.filter((name) => !usersNameBd?.includes(name));

  if (notFindUsersBd?.length) {
    Users.create(notFindUsersBd, Number(chatInternalId), (err) => {
      if (err) return;
    });
  }

  return { notFindUsersBd, usersNameBd };
}
