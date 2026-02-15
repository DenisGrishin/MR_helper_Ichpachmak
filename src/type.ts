import { CallbackQueryContext, Context, SessionFlavor } from 'grammy';

import { HydrateFlavor } from '@grammyjs/hydrate';
import { KeyCommand } from './constant/constant';

export interface SessionData {
  keyCommand?: KeyCommand | null;
  userId?: number | null;
  chatId?: number | null;
  chatTitle: string | null;
  addConfigChat: string | null;
  filedUpdateBD: string | null;
  gitLabTokens?: string[];
  chatInternalId: number | null;
}

export type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;

export type TCallbackQueryContext = CallbackQueryContext<MyContext>;
