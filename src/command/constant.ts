export enum KeyCommand {
  setUser = 'set_user',
  delete = 'delete_user',
  setIdGitLab = 'set_id_git_lab',
  updatePreset = 'update_preset',
  allUser = 'all_user',
  showPreset = 'show_preset',
  menu = 'menu',
  editStatusUser = 'edit_status_user',
  yesAnswer = 'yes_answer',
  noAnswer = 'no_answer',
  deletePreset = 'delete_preset',
  backToMenu = 'back_to_menu',
  completedTasks = 'completed_tasks',
  chatСonfig = 'chat_config',
  addTokenGitLab = 'add_token_git_lab',
  createTasksListTEST = 'qwe',
  createTasksListSTAGE = 'qwes',
}

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
