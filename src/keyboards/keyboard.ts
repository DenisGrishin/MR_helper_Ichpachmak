import { InlineKeyboard } from 'grammy';
import { IUser } from '../db/db';
import { KeyCommand } from '../command/constant';

export const keyboardMenu = new InlineKeyboard()
  .text('Активировать пользователя', KeyCommand.editStatusUser)
  .text('Удалить пользователя', KeyCommand.delete)
  .row()
  .text('Обновить пресет', KeyCommand.updatePreset)
  .text('Список всех пользователей', KeyCommand.allUser)
  .row()
  .url(
    'Документация',
    'https://wiki.yandex.ru/napravlenija-kompanii/frontend/spisok-botov/mr-helper/'
  );

export const keyboardBack = new InlineKeyboard().text(
  '< Назад',
  KeyCommand.backToMenu
);

export const keyboardAskUserConfirmation = new InlineKeyboard()
  .text('Нет', KeyCommand.noAnswer)
  .text('Да', KeyCommand.yesAnswer);

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
        `preset-${user.name}`
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
