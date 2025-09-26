import { User, IUser } from './db';

export function getAllUsers(): Promise<IUser[]> {
  return new Promise((resolve, reject) => {
    User.all((err, users) => {
      if (err) return reject(err);
      resolve(users || []);
    });
  });
}

export function findUser(
  slug: number | string[],
  keySearch: 'id' | 'name'
): Promise<IUser[] | undefined> {
  return new Promise((resolve, reject) => {
    User.findUsers(slug as string[], keySearch, (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
}

export async function getNameBd(users?: string[]): Promise<{
  notFindUsersDb: string[];
  usersNameBd: string[];
}> {
  const findUsersDb = await findUser(users || [], 'name');

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
