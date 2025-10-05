import { CallbackQueryContext, Context, SessionFlavor } from 'grammy';
import { KeyCommand } from './command/constant';
import { HydrateFlavor } from '@grammyjs/hydrate';

export interface SessionData {
  keyCommand?: KeyCommand | null;
  userId?: number | null;
  timeToCheck: number | null;
}

export type MyContext = HydrateFlavor<Context> & SessionFlavor<SessionData>;

export type TCallbackQueryContext = CallbackQueryContext<MyContext>;
