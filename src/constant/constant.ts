import { ChatСonfig } from '../db';

export enum KeyCommand {
  setUser = 'set_user',
  delete = 'delete_user',
  updatePreset = 'update_preset',
  allUser = 'all_user',
  showPreset = 'show_preset',
  menu = 'menu',
  editStatusSendMRUser = 'edit_status_user',
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
  setAdmins = 'set_admins',
}

export const LIST_FIELD_CHAT_CONFIG: Record<keyof ChatСonfig, string> = {
  chatTitle: 'название чата',
  tokenGitLab: 'токен GitLab',
  gitBaseUrl: 'отправте baseUrl для GitLab пример: https://gitlab.com',
};
