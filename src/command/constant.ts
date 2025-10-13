export enum KeyCommand {
  set = 'set_user',
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
}

export const TEXT_COMMAND: Record<string, string> = {
  [`${KeyCommand.set}`]:
    'Укажите теги идентификаторы пользователей, которых необходимо добавить в систему.',
  [`${KeyCommand.setIdGitLab}`]: 'Укажите id пользователя GitLab.',
};

export const LIST_MY_COMMAND = [
  { command: KeyCommand.menu, description: 'Меню' },
  { command: KeyCommand.set, description: 'Добавить пользователя' },
  {
    command: KeyCommand.setIdGitLab,
    description: 'Добавить пользователю id gitLab',
  },
  {
    command: KeyCommand.completedTasks,
    description: 'Посмотреть список выполененых задач',
  },
];
