export type CommandAction =
  | 'setUser'
  | 'editStatus'
  | 'delete'
  | 'chatDelete'
  | 'editChatConfig';

export type nameCallbackQuery = 'selectChat' | 'newUser';

export type modKeybord = 'reply' | 'editText';
