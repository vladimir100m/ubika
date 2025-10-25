import { randomBytes } from 'crypto';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const shouldLog = (level: LogLevel) => {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[DEFAULT_LEVEL];
};

const format = (level: LogLevel, msg: string, meta?: any) => {
  const time = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${time} [${level.toUpperCase()}] ${msg}${metaStr}`;
};

export const createRequestId = (prefix = '') => `${prefix}${randomBytes(6).toString('hex')}`;

export const createLogger = (reqId?: string) => {
  const withId = (m: string) => (reqId ? `[${reqId}] ${m}` : m);

  return {
    debug: (msg: string, meta?: any) => {
      if (shouldLog('debug')) console.debug(format('debug', withId(msg), meta));
    },
    info: (msg: string, meta?: any) => {
      if (shouldLog('info')) console.info(format('info', withId(msg), meta));
    },
    warn: (msg: string, meta?: any) => {
      if (shouldLog('warn')) console.warn(format('warn', withId(msg), meta));
    },
    error: (msg: string, meta?: any) => {
      if (shouldLog('error')) console.error(format('error', withId(msg), meta));
    },
  };
};

// default logger (no request id)
const logger = createLogger();
export default logger;
