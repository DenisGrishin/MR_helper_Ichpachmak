import { KeyCommand } from '../constant/constant';

export const TEXT_COMMAND: Record<string, string> = {
  [`${KeyCommand.setUser}`]:
    'Укажите теги идентификаторы пользователей, которых необходимо добавить в систему.',
  // [`${KeyCommand.setIdGitLab}`]: "Укажите id пользователя GitLab.",
  [`${KeyCommand.createTasksListTEST}`]:
    'Отправьте список веток, чтоб сформировать список задач для площадки TEST',
  [`${KeyCommand.createTasksListSTAGE}`]:
    'Отправьте список веток, чтоб сформировать список задач для площадки STAGE',
};

export const LIST_MY_COMMAND = [
  { command: KeyCommand.menu, description: 'Меню' },
  { command: KeyCommand.setUser, description: 'Добавить пользователя' },
  // {
  //   command: KeyCommand.setIdGitLab,
  //   description: "Добавить пользователю id gitLab",
  // },
  {
    command: KeyCommand.completedTasks,
    description: 'Посмотреть список выполененых задач',
  },
  {
    command: KeyCommand.createTasksListTEST,
    description: 'Создать список задач TEST',
  },
  {
    command: KeyCommand.createTasksListSTAGE,
    description: 'Создать список задач STAGE',
  },
];
