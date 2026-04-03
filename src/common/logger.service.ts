import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  log(message: string, context?: string) {
    console.log(`[${this.getTimestamp()}] [INFO] ${context ? `[${context}] ` : ''}${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${this.getTimestamp()}] [ERROR] ${context ? `[${context}] ` : ''}${message}`, trace || '');
  }

  warn(message: string, context?: string) {
    console.warn(`[${this.getTimestamp()}] [WARN] ${context ? `[${context}] ` : ''}${message}`);
  }

  debug(message: string, context?: string) {
    console.debug(`[${this.getTimestamp()}] [DEBUG] ${context ? `[${context}] ` : ''}${message}`);
  }

  verbose(message: string, context?: string) {
    console.log(`[${this.getTimestamp()}] [VERBOSE] ${context ? `[${context}] ` : ''}${message}`);
  }
}