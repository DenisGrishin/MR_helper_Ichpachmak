import { ChatMembers } from '../../db/chatMembers';
import { TCallbackQueryContext } from '../../type';
import { createListUsers } from './helper';

export const handlerUpatePreset = async (ctx: TCallbackQueryContext) => {
  ctx.answerCallbackQuery().catch(() => {});
  const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);
  const name = ctx.callbackQuery.data.split(':')[3];
  const authorId = Number(ctx.callbackQuery.data.split(':')[4]);

  const user = await ChatMembers.findChatMember(authorId, chatInternalId, [
    'preset',
  ]);

  const preset = JSON.parse(user?.preset || '[]');

  const updatePreset = preset.includes(name)
    ? preset.filter((el: string) => el !== name)
    : [...preset, name];

  ChatMembers.updateField(authorId, chatInternalId, {
    preset: JSON.stringify(updatePreset),
  });

  createListUsers(ctx, 'updatePreset', chatInternalId);
};
