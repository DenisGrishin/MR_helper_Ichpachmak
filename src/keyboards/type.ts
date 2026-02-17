export type CommandAction =
  | 'setUser'
  | 'editStatusSendMR'
  | 'delete'
  | 'chatDelete'
  | 'editChatConfig'
  | 'deleteFromChat'
  | 'addUserToChat'
  | 'completedTasks'
  | 'allUser';

export type nameCallbackQuery = 'selectChat' | 'newUser';

export type modKeybord = 'reply' | 'editText';
