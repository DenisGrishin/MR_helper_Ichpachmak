import { InlineKeyboard } from 'grammy';
import { IUser } from '../db/db';
import { KeyListCommand } from '../command/constant';

export const keyboardMenu = new InlineKeyboard()
  .text('Активировать пользователя', KeyListCommand.editStatusUser)
  .text('Удалить пользователя', KeyListCommand.delete)
  .row()
  .text('Обновить пресет', KeyListCommand.updatePreset)
  .text('Список всех пользователей', KeyListCommand.allUser)
  .row()
  .url(
    'Документация',
    'https://wiki.yandex.ru/napravlenija-kompanii/frontend/spisok-botov/mr-helper/'
  );

export const keyboardBack = new InlineKeyboard().text(
  '< Назад',
  KeyListCommand.backToMenu
);

export const keyboardAskUserConfirmation = new InlineKeyboard()
  .text('Нет', KeyListCommand.noAnswer)
  .text('Да', KeyListCommand.yesAnswer);

export const chunkInlineKeyboardUser = ({
  list,
  textQuery,
}: {
  list: IUser[];
  textQuery: 'editStatus' | 'delete';
}) => {
  const keyboardButtonRows: any[] = [];

  for (let i = 0; i < list.length; i += 3) {
    const sliceUser = list.slice(i, i + 3).map((user) => {
      return InlineKeyboard.text(
        `${user.isActive ? '✅' : '❌'} ${user.name}`,
        `${textQuery}-${user.id}`
      );
    });

    keyboardButtonRows.push(sliceUser);
  }

  keyboardButtonRows.push([
    InlineKeyboard.text('< Назад', KeyListCommand.backToMenu),
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
        `preset-${user.name}`
      );
    });

    keyboardButtonRows.push(sliceUser);
  }

  keyboardButtonRows.push([
    InlineKeyboard.text('< Назад', KeyListCommand.backToMenu),
    InlineKeyboard.text('Удалить свой пресет', KeyListCommand.deletePreset),
  ]);

  return keyboardButtonRows;
};
