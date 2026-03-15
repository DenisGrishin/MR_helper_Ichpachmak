import pino from 'pino';

const logger = pino({
  transport: {
    targets: [
      {
        target: 'pino-roll',
        options: {
          file: `logs/bot.log`,
          size: '10M',
          mkdir: true,
          limit: { count: 3 },
        },
      },
      // {
      //   target: 'pino-pretty',
      //   options: {
      //     colorize: true,
      //     translateTime: 'SYS:standard',
      //     ignore: 'pid,hostname',
      //   },
      // },
    ],
  },
});

export default logger;
