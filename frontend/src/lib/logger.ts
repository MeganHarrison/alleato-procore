/**
 * Production-ready logging service
 * Replaces console.log statements with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  projectId?: string | number;
  action?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug') && this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      const fullContext = {
        ...context,
        error: errorMessage,
        stack: this.isDevelopment ? stack : undefined,
      };

      console.error(this.formatMessage('error', message, fullContext));

      // In production, send to error tracking service
      if (!this.isDevelopment && typeof window !== 'undefined') {
        // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
        this.sendToErrorTracking(message, error, context);
      }
    }
  }

  private sendToErrorTracking(
    message: string,
    error: unknown,
    context?: LogContext
  ): void {
    // Placeholder for error tracking integration
    // This would send errors to Sentry, LogRocket, or similar service
    try {
      // Example: Sentry.captureException(error, { extra: context });
    } catch {
      // Fail silently if error tracking fails
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing purposes
export { Logger };

// Usage examples:
// logger.debug('Fetching user data', { userId: '123' });
// logger.info('User logged in', { userId: '123', action: 'login' });
// logger.warn('API rate limit approaching', { remaining: 10 });
// logger.error('Failed to save data', error, { userId: '123', action: 'save' });