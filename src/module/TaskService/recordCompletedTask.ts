import { Users } from '../../db';
import { ChatMembers } from '../../db/chatMembers';

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

  ChatMembers.updateField(userInternalId, chatInternalId, {
    completedTasks: JSON.stringify([...completedTasks, taskNumber]),
  });
};
