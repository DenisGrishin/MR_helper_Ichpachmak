import { InlineKeyboard } from 'grammy';

import { IUser } from '../db';
import { IChat } from '../db/chatConfig/chatСonfig';
import { CommandAction, nameCallbackQuery } from './type';
import { KeyCommand } from '../constant/constant';

export const userKeyboardMenu = new InlineKeyboard()
  .text('Обновить пресет', KeyCommand.updatePreset)
  .text('Список всех пользователей', KeyCommand.allUser)
  .row()
  .url(
    'Документация',
    'https://wiki.yandex.ru/napravlenija-kompanii/frontend/spisok-botov/mr-helper/',
  );

export const adminKeyboardMenu = new InlineKeyboard()
  .text('Активировать пользователя', KeyCommand.editStatusSendMRUser)
  .row()
  .text('Добавить пользователя в чат', KeyCommand.addUserToChat)
  .row()
  .text('⚠️ Удалить пользователя', KeyCommand.delete)
  .row()
  .text('Удалить пользователя из чата', KeyCommand.deleteFromChat)
  .row()
  .text('Список всех пользователей', KeyCommand.allUser)
  // .row()
  // .text('Обновить пресет', KeyCommand.updatePreset)
  .row()
  .text('Конфигурации чатов', KeyCommand.chatСonfig)
  .row()
  .url(
    'Документация',
    'https://wiki.yandex.ru/napravlenija-kompanii/frontend/spisok-botov/mr-helper/',
  );

export const keyboardConfigChat = () =>
  new InlineKeyboard().text('Добавить токен GitLab');

export const createKeyboardAskUserConfirmation = (
  chatInternalId: number,
  id: number,
  action: KeyCommand,
) => {
  return new InlineKeyboard()
    .text('Нет', `${KeyCommand.noAnswer}:${chatInternalId}:${action}`)
    .text('Да', `${KeyCommand.yesAnswer}:${id}:${chatInternalId}:${action}`);
};

export const chunkInlineKeyboardChats = ({
  list,
  textQuery,
  action,
}: {
  list: IChat[];
  textQuery: nameCallbackQuery;
  action?: CommandAction;
}) => {
  const keyboardButtonRows: any[] = [];

  for (let i = 0; i < list.length; i += 2) {
    const sliceChat = list.slice(i, i + 2).map((chat) => {
      return InlineKeyboard.text(
        chat.chatTitle,
        `${textQuery}:${chat.id}:${chat.chatId}:${chat.chatTitle}:${action}`,
      );
    });

    keyboardButtonRows.push(sliceChat);
  }

  keyboardButtonRows.push([
    InlineKeyboard.text('< Назад', KeyCommand.backToMenu),
  ]);

  return keyboardButtonRows;
};

export const chunkInlineKeyboardUser = ({
  list,
  action,
  chatInternalId,
}: {
  list: any;
  action: CommandAction;
  chatInternalId: number;
}) => {
  const keyboardButtonRows: any[] = [];

  for (let i = 0; i < list.length; i += 3) {
    const sliceUser = list.slice(i, i + 3).map((user: any) => {
      return InlineKeyboard.text(
        `${user.isActive ? '✅' : '❌'} ${user.name}`,
        `${action}:${user.id}:${chatInternalId}`,
      );
    });

    keyboardButtonRows.push(sliceUser);
  }

  keyboardButtonRows.push([
    InlineKeyboard.text('< Назад', KeyCommand.backToMenu),
  ]);

  return keyboardButtonRows;
};

export const chunkInlineKeyboardPreset = ({
  list,
  preset,
}: {
  list: IUser[];
  preset: string[];
}) => {
  const keyboardButtonRows: any[] = [];

  for (let i = 0; i < list.length; i += 3) {
    const sliceUser = list.slice(i, i + 3).map((user) => {
      return InlineKeyboard.text(
        `${preset.includes(user.name) ? '✅' : '❌'} ${user.name}`,
        `preset-${user.name}`,
      );
    });

    keyboardButtonRows.push(sliceUser);
  }

  keyboardButtonRows.push([
    InlineKeyboard.text('< Назад', KeyCommand.backToMenu),
    InlineKeyboard.text('Удалить свой пресет', KeyCommand.deletePreset),
  ]);

  return keyboardButtonRows;
};
