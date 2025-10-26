import { IUser, TasksUsers, Users } from '../../db';
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

  recordCompletedTask = async (
    taskNumber: string,
    authorMR: IUser,
    ctx: MyContext
  ) => {
    const completedTasks = JSON.parse(authorMR.completedTasks);

    const isNewDay = this.hasDayChanged({
      dateMsg: ctx.msg?.date,
      timeToCheck: this.timeToCheck,
    });

    if (isNewDay) {
      Users.deleteAllCompletedTasks(() => {});
      this.createTimeToCheck();
    }

    if (
      completedTasks.some(
        (task: CompletedTask) => task.taskNumber === taskNumber
      )
    ) {
      return;
    }

    try {
      if (!taskNumber) throw new Error('Нет номара задачи');

      const updateCompletedTasks = JSON.stringify([
        ...(isNewDay ? [] : completedTasks),
        { taskNumber, dateTask: ctx.message?.date },
      ]);

      // TODO тут дописать третий аругемент
      Users.updateCompletedTasks(authorMR.id, updateCompletedTasks, () => {});
    } catch (error) {
      console.error(error);
    }
  };

  recordTask = async (currentTask: string, idAuthor: number) => {
    console.log('idAuthor ==> ', idAuthor);
    const tasksUser = await TasksUsers.findUserById(idAuthor);
    console.log('tasksUser ==> ', tasksUser);
    const tasks = JSON.parse(tasksUser.completedTasks) || [];

    if (currentTask === 'UNKNOWN') return;

    if (tasks.some((task: string) => task === currentTask)) return;

    const updatedUsersTasks = JSON.stringify([...tasks, currentTask]);
    console.log('updatedUsersTasks ==> ', updatedUsersTasks);

    TasksUsers.updateCompletedTasks(idAuthor, updatedUsersTasks, () => {});
  };
}

export const taskService = new TaskService();
