import { User, IUser } from './db';

export function getAllUsers(): Promise<IUser[]> {
  return new Promise((resolve, reject) => {
    User.all((err, users) => {
      if (err) return reject(err);
      resolve(users || []);
    });
  });
}

function getFindUsers(name: string): Promise<IUser | undefined> {
  return new Promise((resolve, reject) => {
    User.find(name, (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
}

export async function findUsersBd(users?: string[]): Promise<{
  findUsersDb: IUser[];
  notFindUsersDb: string[];
  namesBd: string[];
}> {
  const findUsersDb: IUser[] = [];
  const notFindUsersDb: string[] = [];

  if (users) {
    for (const name of users) {
      const user = await getFindUsers(name);

      if (!user) notFindUsersDb.push(name);
      if (user) findUsersDb.push(user);
    }
  }

  const namesBd = findUsersDb
    .filter((el) => el !== undefined)
    .map((el) => el.name);

  return { findUsersDb, notFindUsersDb, namesBd };
}

export function findUsersByIdGitlab(idGitLab: number[]): Promise<IUser[]> {
  return new Promise((resolve, reject) => {
    User.findByIdGitLabs(idGitLab, (err, users) => {
      if (err) return reject(err);
      resolve(users || []);
    });
  });
}

export async function findUser(name: string): Promise<IUser | undefined> {
  return await getFindUsers(name);
}
