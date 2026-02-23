import nodeCron from 'node-cron';
import { ChatMembers } from '../../db/chatMembers';

export const resetCompletedTasks = () => {
  nodeCron.schedule('0 0 * * * *', () => {
    ChatMembers.clearField('completedTasks');
    console.log('Очистил у всех список выполненных задач');
  });
};
