import { findUserById, IUser, Users } from '../../db';
import { MyContext } from '../../type';
import { CompletedTask } from '../type';

class TaskService {
  timeToCheck: number | null = null;

  constructor() {
    this.validateTimeToCheck();
  }

  validateTimeToCheck = async () => {
    // todo учесть часовой пояс
    // этот код отвечает если нет времени для проверки нового дня(timeToCheck)
    if (!this.timeToCheck) {
      const oneCompletedTask = await this.getOneCompletedTask();

      if (!oneCompletedTask?.length) {
        this.timeToCheck = this.createTimeToCheck();
      } else {
        this.timeToCheck = oneCompletedTask[0].dateTask;
      }
    }
  };

  createTimeToCheck = () => {
    const currentDate = Math.floor(Date.now() / 1000);
    this.timeToCheck = currentDate;
    return currentDate;
  };

  hasDayChanged = ({
    dateMsg,
    timeToCheck,
  }: {
    dateMsg?: number;
    timeToCheck?: number | null;
  }) => {
    if (!dateMsg || !timeToCheck) return false;

    const parseCurrentDate = new Date(dateMsg * 1000);
    const parseTimeToCheck = new Date(timeToCheck * 1000);

    const isNewDay = parseCurrentDate.getDate() !== parseTimeToCheck.getDate();

    if (isNewDay) return true;
    return false;
  };

  getOneCompletedTask = async () => {
    return;
    const allCompletedTasks = await Users.getCompletedTasks();

    let completedTask = null;

    for (let index = 0; index < allCompletedTasks.length; index++) {
      const element = allCompletedTasks[index];
      const tasks = JSON.parse(element.completedTasks);

      if (tasks.length) {
        completedTask = tasks;
        break;
      }
    }

    return completedTask;
  };

  recordCompletedTask = async ({
    taskNumber,
    completedTasks,
    ctx,
  }: {
    taskNumber: string;
    completedTasks: string[];
    ctx: MyContext;
  }) => {
    console.log('taskNumber ==> ', taskNumber);
  };

  recordTask = async (currentTask: string, idAuthor: number) => {
    const tasksUser = await findUserById(idAuthor, 'tasksUsers');

    if (!tasksUser) throw new Error('Не нашли пользвателя');

    const tasks = JSON.parse(tasksUser.completedTasks) || [];

    if (currentTask === 'UNKNOWN') return;

    if (tasks.some((task: string) => task === currentTask)) return;

    const updatedUsersTasks = JSON.stringify([...tasks, currentTask]);

    // Users.updateCompletedTasks(
    //   idAuthor,
    //   updatedUsersTasks,
    //   'tasksUsers',
    //   () => {},
    // );
  };
}

export const taskService = new TaskService();
