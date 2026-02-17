import { Users } from '../../db';

export const recordCompletedTask = async ({
  taskNumber,
  completedTasks,
  chatInternalId,
  userInternalId,
}: {
  taskNumber: string;
  completedTasks: string[];
  chatInternalId: number;
  userInternalId: number;
}) => {
  if (completedTasks.includes(taskNumber)) {
    console.log('акая задача уже есть в списке');
    return;
  }

  Users.updateChatMember(userInternalId, chatInternalId, {
    completedTasks: JSON.stringify([...completedTasks, taskNumber]),
  });
};
