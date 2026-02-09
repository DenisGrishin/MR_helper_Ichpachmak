import { ChatСonfig } from '../db';

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
  addConfigChat = 'add_config_chat',
}

export const LIST_ID_USER_ADMIN = [
  473675861, 8118180262, 856816417, 708634774, 1385322065,
];

export const ID_BOT = 473675861;

export const LIST_FIELD_CHAT_CONFIG: Record<keyof ChatСonfig, string> = {
  chatTitle: 'Название чата',
  tokenGitLab: 'Токен GitLab',
};
