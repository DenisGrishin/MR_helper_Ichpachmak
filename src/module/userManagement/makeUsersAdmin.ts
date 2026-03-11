import { MyContext } from '../../type';

export const makeUsersAdmin = async (ctx: MyContext) => {
  if (!ctx.chat || ctx.chat.type === 'private') {
    await ctx.reply('Эту команду можно использовать только в групповых чатах.');
    return;
  }
};
