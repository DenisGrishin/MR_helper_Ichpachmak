import { ChatMembers } from './chatMembers';
import { Users } from './users';

export async function syncUsersWithDb(
  chatInternalId: number,
  users?: string[],
) {
  const findUsersDb = await ChatMembers.findUsersByName(
    users || [],
    chatInternalId,
  );

  const alreadyInChat = findUsersDb?.map((user: any) => user.name);

  const newUsersChat = users?.filter((name) => !alreadyInChat?.includes(name));

  if (newUsersChat?.length) {
    Users.create(newUsersChat, Number(chatInternalId), (err: any) => {
      if (err) return;
    });
  }

  return { newUsersChat, alreadyInChat };
}
