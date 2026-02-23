export type CommandAction =
  | 'setUser'
  | 'editStatusSendMR'
  | 'delete'
  | 'chatDelete'
  | 'editChatConfig'
  | 'completedTasks'
  | 'allUser'
  | 'updatePreset';

export type nameCallbackQuery = 'selectChat' | 'newUser';

export type modKeybord = 'reply' | 'editText';
