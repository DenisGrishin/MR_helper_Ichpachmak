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

export const findUsersByName = async (values: string[]): Promise<IUser[]> => {
  try {
    const res = await Users.findUsersByName(values);

    return res;
  } catch (error) {
    console.error('Ошибка', error);
    throw error;
  }
};

export const findUserById = async (
  id: number,
  nameTable: NameTableBD
): Promise<IUser | undefined> => {
  try {
    const res = await Users.findUserById(id, nameTable);

    return res;
  } catch (error) {
    console.error('Ошибка', error);
  }
};

export async function getNamesBd(users?: string[]) {
  const findUsersDb = await findUsersByName(users || []);

  const usersNameBd = findUsersDb?.map((user) => user.name) || [];

  const notFindUsersDb =
    users?.filter((name) => !usersNameBd?.includes(name)) || [];

  return { notFindUsersDb, usersNameBd };
}

export function findUsersByIdGitlab(idGitLab: number[]) {
  try {
    const res = Users.findByIdGitLabs(idGitLab);

    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
