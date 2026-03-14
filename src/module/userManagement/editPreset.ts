import { ChatMembers } from '../../db/chatMembers';
import { TCallbackQueryContext } from '../../type';
import { createListUsers } from './helper';
import { logger } from '../../config';

export const handlerUpatePreset = async (ctx: TCallbackQueryContext) => {
  try {
    ctx.answerCallbackQuery().catch(() => {});
    const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);
    const name = ctx.callbackQuery.data.split(':')[3];
    const authorId = Number(ctx.callbackQuery.data.split(':')[4]);

    logger.info(
      `Обновление пресета "${name}" для пользователя ${authorId} в чате ${chatInternalId}`,
    );

    const user = await ChatMembers.findChatMember(authorId, chatInternalId, [
      'preset',
    ]);

    const preset = JSON.parse(user?.preset || '[]');

    const updatePreset = preset.includes(name)
      ? preset.filter((el: string) => el !== name)
      : [...preset, name];

    await ChatMembers.updateField(authorId, chatInternalId, {
      preset: JSON.stringify(updatePreset),
    });

    logger.info(
      `Пресет "${name}" ${preset.includes(name) ? 'удален из' : 'добавлен в'} список пользователя ${authorId}`,
    );

    createListUsers(ctx, 'updatePreset', chatInternalId);

    logger.info('Список пользователей обновлен после изменения пресета');
  } catch (error) {
    logger.error(
      `Ошибка в handlerUpatePreset: ${error instanceof Error ? error.message : error}`,
    );
  }
};
