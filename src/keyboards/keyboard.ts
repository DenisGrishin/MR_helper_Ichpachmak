import { InlineKeyboard } from 'grammy';

import { IChat } from '../db/chatСonfig';
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
  .text('⚠️ Удалить пользователя', KeyCommand.delete)
  .row()
  .text('Список всех пользователей', KeyCommand.allUser)
  .text('Обновить пресет', KeyCommand.updatePreset)
  .row()
  .text('Конфигурации чатов', KeyCommand.chatСonfig)
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
  authorData,
}: {
  list: any;
  action: CommandAction;
  chatInternalId: number;
  authorData?: any;
}) => {
  const keyboardButtonRows: any[] = [];

  const preset = JSON.parse(authorData?.preset || '[]');

  for (let i = 0; i < list.length; i += 3) {
    const sliceUser = list.slice(i, i + 3).map((user: any) => {
      const queryParams = `${action}:${user.id}:${chatInternalId}`;

      if (action === 'updatePreset') {
        return InlineKeyboard.text(
          `${preset.includes(user.name) ? '✅' : '❌'} ${user.name}`,
          `${queryParams}:${user.name}:${authorData?.id}`,
        );
      }

      return InlineKeyboard.text(
        `${user.isActive ? '✅' : '❌'} ${user.name}`,
        queryParams,
      );
    });

    keyboardButtonRows.push(sliceUser);
  }

  keyboardButtonRows.push([
    InlineKeyboard.text('< Назад', KeyCommand.backToMenu),
  ]);

  return keyboardButtonRows;
};
