import { KeyCommand } from '../../constant/constant';
import { Users } from '../../db';
import { ChatMembers } from '../../db/chatMembers';
import { createKeyboardAskUserConfirmation } from '../../keyboards/keyboard';
import { TCallbackQueryContext } from '../../type';
import { logger } from '../../config';

export const handlerDeleteUser = async ({
  ctx,
  text,
  action,
}: {
  ctx: TCallbackQueryContext;
  text: string;
  action: 'delete';
}) => {
  try {
    ctx.answerCallbackQuery();
    const userInternalId = Number(ctx.callbackQuery.data.split(':')[1]);
    const chatInternalId = Number(ctx.callbackQuery.data.split(':')[2]);

    logger.info(
      `Обработка удаления пользователя ID: ${userInternalId} из чата: ${chatInternalId}`,
    );

    const user: any = await Users.findUser(
      userInternalId,
      'id',
      (err, users) => {
        if (err) {
          logger.error(`Ошибка при поиске пользователя: ${err}`);
        } else if (users && users.length > 0) {
          logger.info(`Пользователь найден: ${users[0].name}`);
        } else {
          logger.warn('Пользователь с таким id не найден');
        }
      },
    );

    ctx.callbackQuery.message?.editText(`${text}\n\n${user?.name}?`, {
      reply_markup: createKeyboardAskUserConfirmation(
        chatInternalId,
        userInternalId,
        KeyCommand[action],
      ),
    });

    logger.info('Меню подтверждения удаления отправлено');
  } catch (error) {
    logger.error(
      `Ошибка в handlerDeleteUser: ${error instanceof Error ? error.message : error}`,
    );
  }
};

export const deleteUser = async (id: number) => {
  try {
    if (!id) {
      logger.warn('Попытка удаления пользователя без ID');
      throw new Error('Нет такого id');
    }

    logger.info(`Удаление пользователя с ID: ${id}`);
    await Users.deleteUser(id);
    logger.info(`Пользователь с ID: ${id} успешно удален`);
  } catch (error) {
    logger.error(
      `Ошибка в deleteUser: ${error instanceof Error ? error.message : error}`,
    );
    throw error;
  }
};

export const deleteChatMebers = async (
  userInternalId: number,
  chatInternalId: number,
) => {
  try {
    if (!userInternalId) {
      logger.warn('Попытка удаления участника без userInternalId');
      throw new Error('Нет такого userInternalId');
    }

    logger.info(
      `Удаление участника ${userInternalId} из чата ${chatInternalId}`,
    );
    await ChatMembers.deleteChatMember(userInternalId, chatInternalId);
    logger.info(
      `Участник ${userInternalId} успешно удален из чата ${chatInternalId}`,
    );
  } catch (error) {
    logger.error(
      `Ошибка в deleteChatMebers: ${error instanceof Error ? error.message : error}`,
    );
    throw error;
  }
};
