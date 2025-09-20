import { CallbackQueryContext, Context, SessionFlavor } from 'grammy';
import { KeyListCommand } from './command/constant';
import { HydrateFlavor } from '@grammyjs/hydrate';

export interface SessionData {
  keyCommand?: KeyListCommand | null;
  userId?: number | null;
}

export type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;

export type TCallbackQueryContext = CallbackQueryContext<MyContext>;
