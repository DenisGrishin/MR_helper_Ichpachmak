import { ChatСonfig } from './chatСonfig';

export const findChatById = async (id: number) => {
  try {
    const chatСonfig = await ChatСonfig.findById(id);

    return chatСonfig;
  } catch (error) {
    console.error('Ошибка', error);
    return null;
  }
};

export const findChatByChatId = async (id: string) => {
  try {
    const chatСonfig = await ChatСonfig.findByTelegramId(id);

    return chatСonfig;
  } catch (error) {
    console.error('Ошибка', error);
    return null;
  }
};
