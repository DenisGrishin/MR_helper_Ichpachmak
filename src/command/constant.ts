export enum KeyListCommand {
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
}

export const TEXT_COMMAND: Record<string, string> = {
  [`${KeyListCommand.set}`]:
    'Укажите теги идентификаторы пользователей, которых необходимо добавить в систему.',
  [`${KeyListCommand.setIdGitLab}`]: 'Укажите id пользователя GitLab.',
};

export const LIST_MY_COMMAND = [
  { command: KeyListCommand.menu, description: 'Меню' },
  { command: KeyListCommand.set, description: 'Добавить пользователей в базу' },
  {
    command: KeyListCommand.setIdGitLab,
    description: 'Добавить пользователя id gitLab',
  },
];
