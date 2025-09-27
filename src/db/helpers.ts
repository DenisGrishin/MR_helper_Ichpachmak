import { User, IUser } from './db';

export function getAllUsers(): Promise<IUser[]> {
  return new Promise((resolve, reject) => {
    User.all((err, users) => {
      if (err) return reject(err);
      resolve(users || []);
    });
  });
}

export const findUsersByName = async (values: string[]): Promise<IUser[]> => {
  try {
    if (!values.length) throw new Error('Вы не передали теги ');

    const res = await User.findUsersByName(values);

    return res;
  } catch (error) {
    console.error('Ошибка', error);
    throw error;
  }
};

export const findUserById = async (id: number): Promise<IUser | undefined> => {
  try {
    const res = await User.findUserById(id);

    return res;
  } catch (error) {
    console.error('Ошибка', error);
  }
};

export async function getNamesBd(users?: string[]): Promise<{
  notFindUsersDb: string[];
  usersNameBd: string[];
}> {
  const findUsersDb = await findUsersByName(users || []);

  const usersNameBd = findUsersDb?.map((user) => user.name) || [];

  const notFindUsersDb =
    users?.filter((name) => !usersNameBd?.includes(name)) || [];

  return { notFindUsersDb, usersNameBd };
}

export function findUsersByIdGitlab(idGitLab: number[]): Promise<IUser[]> {
  return new Promise((resolve, reject) => {
    User.findByIdGitLabs(idGitLab, (err, users) => {
      if (err) return reject(err);
      resolve(users || []);
    });
  });
}
