import winston from 'winston';
import { LOGGING_LEVEL } from '../config';

winston.loggers.add('app', {
  transports: [
    new winston.transports.Console({
      level: LOGGING_LEVEL,
      name: 'console',
      colorize: true,
      label: 'App',
    }),
  ],
});

// set the default app Logger
const logger = winston.loggers.get('app');
export const stream = {
  write: message => logger.info(message),
};

export default logger;
