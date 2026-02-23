import { ChatСonfig, Users } from '../../db';
import { MyContext } from '../../type';
import { deleteChatMebers } from '../userManagement/delete';

export const leaveUserToChat = async (ctx: MyContext) => {
  const chatId = Number(ctx.chat?.id);
  const chat = await ChatСonfig.findByTelegramId(chatId);

  const user = await Users.findUser(
    `@${ctx.from?.username}`,
    'name',
    (err, users) => {
      if (err) {
        console.error(err);
      } else if (users && users.length > 0) {
        console.log('Пользователь найден:', users[0]);
      } else {
        console.log('Пользователь с таким id не найден');
      }
    },
  );

  // TODO тут что то другое придумать, т.к при удалении бота дропает ошибку
  if (!user || !chat) {
    console.log('Не удалось найти пользователя или чат в базе данных');
    return;
  }

  deleteChatMebers(user.id, chat.id);

  console.log(
    `Пользователь ${ctx.from?.first_name} ${ctx.from?.last_name ?? ''} был удален из чата ${chat.chatTitle}`,
  );
};
