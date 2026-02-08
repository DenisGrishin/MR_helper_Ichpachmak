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
  .text('Активировать пользователя', KeyCommand.editStatusUser)
  .text('Удалить пользователя', KeyCommand.delete)
  .row()
  .text('Обновить пресет', KeyCommand.updatePreset)
  .text('Список всех пользователей', KeyCommand.allUser)
  .row()
  .text('Конфигурации чатов', KeyCommand.chatСonfig)
  .url(
    'Документация',
    'https://wiki.yandex.ru/napravlenija-kompanii/frontend/spisok-botov/mr-helper/',
  );

export const keyboardConfigChat = () =>
  new InlineKeyboard().text('Добавить токен GitLab');

export const keyboardAskUserConfirmation = new InlineKeyboard()
  .text('Нет', KeyCommand.noAnswer)
  .text('Да', KeyCommand.yesAnswer);

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
      // тире есть в самом id чата
      return InlineKeyboard.text(
        chat.chatTitle,
        `${textQuery}${chat.chatId}-${chat.chatTitle}-${action}`,
      );
    });

    keyboardButtonRows.push(sliceChat);
  }

  return keyboardButtonRows;
};

export const chunkInlineKeyboardUser = ({
  list,
  action,
}: {
  list: IUser[];
  action: CommandAction;
}) => {
  const keyboardButtonRows: any[] = [];

  for (let i = 0; i < list.length; i += 3) {
    const sliceUser = list.slice(i, i + 3).map((user) => {
      return InlineKeyboard.text(
        `${user.isActive ? '✅' : '❌'} ${user.name}`,
        `${action}-${user.id}`,
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
