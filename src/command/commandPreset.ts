import { InlineKeyboard } from 'grammy';
import {
  chunkInlineKeyboardPreset,
  keyboardAskUserConfirmation,
} from '../keyboards/keyboard';
import { TCallbackQueryContext } from '../type';
import { findUsersByName, getAllUsers } from '../db/helpers';

import { Users } from '../db';
import { KeyCommand } from '../constant/constant';

export const commandUpdatePreset = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const listUsers = await getAllUsers();

  const formUser = ctx.from.username;

  if (!formUser) throw new Error(`Такого имени нет ${formUser}`);

  const user = await findUsersByName([`@${formUser}`]);

  const preset = JSON.parse(user[0].preset || '');

  const keyboardUser = InlineKeyboard.from(
    chunkInlineKeyboardPreset({ list: listUsers, preset }),
  );

  await ctx.callbackQuery.message?.editText(
    preset.length ? `Ваш прессет: ${preset}` : 'Вы еще не создали пресет',
    {
      reply_markup: keyboardUser,
    },
  );
};

export const commandDeletePreset = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  ctx.session.keyCommand = KeyCommand.deletePreset;

  await ctx.callbackQuery.message?.editText(
    'Вы уверены, что хотите удалить свой пресет?',
    {
      reply_markup: keyboardAskUserConfirmation,
    },
  );
};

export const deletePreset = async (ctx: TCallbackQueryContext) => {
  const authorName = ctx.from.username;
  const user = await findUsersByName([`@${authorName}`]);

  Users.updatePreset(Number(user[0].id), JSON.stringify([]), (err) => {
    if (err) console.error(err);
  });
};

export const commandButtonPreset = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const nameSlug = ctx.callbackQuery.data.split('-')[1];

  const authorName = ctx.from.username;

  if (!authorName) throw new Error('Имени нет в  ctx.from.username ');

  const user = await findUsersByName([`@${authorName}`]);

  const presetList = JSON.parse(user[0].preset || '[]');

  const updateListPreset = presetList.includes(nameSlug)
    ? presetList.filter((name: string) => name !== nameSlug)
    : [...presetList, nameSlug];

  Users.updatePreset(
    Number(user[0].id),
    JSON.stringify(updateListPreset),
    (err) => {
      if (err) console.error(err);
    },
  );

  commandUpdatePreset(ctx);
};
