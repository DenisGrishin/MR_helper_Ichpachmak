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
  slug: number | string,
  key: 'id' | 'name'
): Promise<IUser | undefined> {
  switch (key) {
    case 'id':
      return new Promise((resolve, reject) => {
        User.findById(slug as number, (err, user) => {
          if (err) return reject(err);
          resolve(user);
        });
      });

    case 'name':
      return new Promise((resolve, reject) => {
        User.findByName(slug as string, (err, user) => {
          if (err) return reject(err);
          resolve(user);
        });
      });
  }
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
      const user = await findUser(name, 'name');

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
