import pino from 'pino';

export default pino({
  transport: {
    targets: [
      {
        target: 'pino-roll',
        options: {
          file: `${__dirname}/logs.log`,
          size: '10M',
          mkdir: true,
          limit: { count: 1 },
        },
      },
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    ],
  },
});
