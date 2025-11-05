import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston logger configuration
 * Creates different log formats for development and production
 */
export const createWinstonConfig = (logLevel: string, isDevelopment: boolean) => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        isDevelopment
          ? nestWinstonModuleUtilities.format.nestLike('SmartNZ', {
              colors: true,
              prettyPrint: true,
            })
          : winston.format.combine(
              winston.format.errors({ stack: true }),
              winston.format.json(),
            ),
      ),
    }),
  ];

  // In production, also log to file
  if (!isDevelopment) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  return {
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
    ),
    transports,
  };
};
