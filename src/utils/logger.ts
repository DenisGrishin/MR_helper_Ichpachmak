export class Logger {
  static error(message: string, context?: Record<string, any>) {
    console.error(`[${new Date().toISOString()}] ❌ ${message}`, context || '');
  }

  static warn(message: string, context?: Record<string, any>) {
    console.warn(`[${new Date().toISOString()}] ⚠️ ${message}`, context || '');
  }

  static info(message: string, context?: Record<string, any>) {
    console.log(`[${new Date().toISOString()}] ℹ️ ${message}`, context || '');
  }

  static success(message: string, context?: Record<string, any>) {
    console.log(`[${new Date().toISOString()}] ✅ ${message}`, context || '');
  }
}
