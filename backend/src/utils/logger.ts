export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  requestId?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  message: string;
  provider?: string;
  operation?: string;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const logger = {
  info(message: string, meta?: Partial<LogEntry>) {
    this.log('info', message, meta);
  },
  warn(message: string, meta?: Partial<LogEntry>) {
    this.log('warn', message, meta);
  },
  error(message: string, errorObj?: any, meta?: Partial<LogEntry>) {
    const errString = errorObj instanceof Error ? errorObj.message : String(errorObj || '');
    this.log('error', message, { ...meta, error: errString });
  },
  debug(message: string, meta?: Partial<LogEntry>) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  },
  log(level: LogEntry['level'], message: string, meta?: Partial<LogEntry>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    // Safe structured output without secrets
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  },
};
