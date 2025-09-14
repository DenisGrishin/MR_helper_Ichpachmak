import { Context } from 'grammy';
import { findUser } from '../db/helpers';

export const commandShowPreset = async (ctx: Context) => {
  const authorMsg = await findUser(`@${ctx.message!.from!.username}`);
  await ctx.reply(
    `${
      !!JSON.parse(authorMsg?.preset || '[]').length
        ? `Ваш пресет: ${JSON.parse(authorMsg!.preset).join(', ')}`
        : 'У вас нет пресета'
    }`,
    { reply_parameters: { message_id: ctx.msg!.message_id } }
  );
};
