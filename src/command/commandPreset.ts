import { InlineKeyboard } from 'grammy';
import {
  chunkInlineKeyboardPreset,
  keyboardAskUserConfirmation,
} from '../keyboards/keyboard';
import { TCallbackQueryContext } from '../type';
import { findUser, getAllUsers } from '../db/helpers';
import { KeyCommand } from './constant';
import { User } from '../db/db';

export const commandUpdatePreset = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const listUsers = await getAllUsers();

  const authorName = ctx.from.username;

  if (!authorName) throw new Error(`Такого имени нет ${authorName}`);

  const user = await findUser(`@${authorName}`, 'name');

  const preset = JSON.parse(user?.preset || '');

  const keyboardUser = InlineKeyboard.from(
    chunkInlineKeyboardPreset({ list: listUsers, preset })
  );

  await ctx.callbackQuery.message?.editText(
    preset.length ? `Ваш прессет: ${preset}` : 'Вы еще не создали пресет',
    {
      reply_markup: keyboardUser,
    }
  );
};

export const commandDeletePreset = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  ctx.session.keyCommand = KeyCommand.deletePreset;

  await ctx.callbackQuery.message?.editText(
    'Вы уверены, что хотите удалить свой пресет?',
    {
      reply_markup: keyboardAskUserConfirmation,
    }
  );
};

export const deletePreset = async (ctx: TCallbackQueryContext) => {
  const authorName = ctx.from.username;
  const user = await findUser(`@${authorName}`, 'name');

  User.updatePreset(Number(user?.id), JSON.stringify([]), (err) => {
    if (err) console.error(err);
  });
};

export const commandButtonPreset = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery();
  const nameSlug = ctx.callbackQuery.data.split('-')[1];

  const authorName = ctx.from.username;

  if (!authorName) throw new Error('Имени нет в  ctx.from.username ');

  const user = await findUser(`@${authorName}`, 'name');

  const presetList = JSON.parse(user?.preset || '[]');

  const updateListPreset = presetList.includes(nameSlug)
    ? presetList.filter((name: string) => name !== nameSlug)
    : [...presetList, nameSlug];

  User.updatePreset(
    Number(user?.id),
    JSON.stringify(updateListPreset),
    (err) => {
      if (err) console.error(err);
    }
  );

  commandUpdatePreset(ctx);
};
