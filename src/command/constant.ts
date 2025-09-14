export enum KeyListCommand {
  set = 'set_user',
  delete = 'delete_user',
  enable = 'enable_user',
  disabled = 'disabled_user',
  setIdGitLab = 'set_id_git_lab',
  updatePreset = 'update_preset',
  allUser = 'all_user',
  showPreset = 'show_preset',
}

export const textCommand: Record<string, string> = {
  [`${KeyListCommand.set}`]:
    'Укажите теги идентификаторы пользователей, которых необходимо добавить в систему.',
  [`${KeyListCommand.delete}`]:
    'Укажите теги пользователей, которых необходимо удалить.',
  [`${KeyListCommand.enable}`]:
    'Укажите теги пользователей, которых необходимо активировать.',
  [`${KeyListCommand.disabled}`]:
    'Укажите теги пользователей, которых необходимо деактивировать.',
  [`${KeyListCommand.setIdGitLab}`]: 'Укажите id пользователя GitLab.',
  [`${KeyListCommand.updatePreset}`]:
    'Укажите теги юзеров которых хотите добавить в пресет',
};

export const listMyCommand = [
  { command: KeyListCommand.set, description: 'Добавить пользователей в базу' },
  { command: KeyListCommand.enable, description: 'Активировать пользователей' },
  {
    command: KeyListCommand.disabled,
    description: 'Деактивировать пользователей',
  },
  {
    command: KeyListCommand.delete,
    description: 'Удалить пользователей из базы',
  },
  { command: KeyListCommand.allUser, description: 'Список всех пользователей' },
  { command: KeyListCommand.updatePreset, description: 'Создать пресет' },
  {
    command: KeyListCommand.setIdGitLab,
    description: 'Добавить пользователя id gitLab',
  },
  { command: KeyListCommand.showPreset, description: 'Посмотреть свой пресет' },
];
