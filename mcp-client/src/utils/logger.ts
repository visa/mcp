/**
 * Structured logger for Visa MCP Client
 * Uses pino for high-performance, structured JSON logging
 */

import pino from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Creates a configured logger instance
 *
 * @param options - Logger configuration options
 * @returns Configured pino logger
 */
export function createLogger(options?: {
  level?: LogLevel;
  name?: string;
  pretty?: boolean;
}) {
  const level = options?.level || (process.env.LOG_LEVEL as LogLevel) || 'info';
  const pretty = options?.pretty ?? process.env.NODE_ENV !== 'production';

  return pino({
    name: options?.name || 'visa-mcp-client',
    level,
    ...(pretty && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });
}

/**
 * Default logger instance for the MCP client
 */
export const logger = createLogger();

/**
 * Creates a child logger with additional context
 *
 * @param context - Additional context to include in all logs
 * @returns Child logger with bound context
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
