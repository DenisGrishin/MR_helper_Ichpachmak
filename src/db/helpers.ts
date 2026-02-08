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

export const findUsersByName = async (values: string[]): Promise<IUser[]> => {
  try {
    const res = await Users.findUsersByName(values);

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

export async function syncUsersWithDb(chatId: string, users?: string[]) {
  const findUsersDb = await findUsersByName(users || []);

  const usersNameBd = findUsersDb?.map((user) => user.name);

  const usersToUpdate = users
    ?.map((name) => {
      const user = findUsersDb.find((u) => name.includes(u.name));
      if (!user) return null;

      const currentChats: string[] = JSON.parse(user.chatIds ?? '[]');

      if (currentChats.includes(chatId)) return null;

      return {
        ...user,
        chatIds: JSON.stringify([...currentChats, chatId]),
      };
    })
    .filter(Boolean) as IUser[];

  const notFindUsersBd = users?.filter((name) => !usersNameBd?.includes(name));

  // Users.create(notFindUsersBd, 'tasksUsers', (err) => {
  //   if (err) return;
  // });

  if (usersToUpdate.length > 0) {
    Users.updateChatIdsForUsers(usersToUpdate, (err, res) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Обновлено записей: ${res?.updated}`);
      }
    });
  }

  if (chatId && notFindUsersBd?.length) {
    Users.create(notFindUsersBd, chatId, 'users', (err) => {
      if (err) return;
    });
  }

  return { notFindUsersBd, usersNameBd, usersToUpdate };
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
