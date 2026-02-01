import { CallbackQueryContext, Context, SessionFlavor } from 'grammy';
import { KeyCommand } from './command/constant';
import { HydrateFlavor } from '@grammyjs/hydrate';

export interface SessionData {
  keyCommand?: KeyCommand | null;
  userId?: number | null;
  chatId?: string | null;
  chatTitle: string | null;
  gitLabTokens: Record<string, string | undefined>;
}

export type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;

export type TCallbackQueryContext = CallbackQueryContext<MyContext>;
