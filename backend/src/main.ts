import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { ConfigService } from './common/config/config.service';
import { createWinstonConfig } from './common/config/logger.config';
import { setupSwagger } from './common/config/swagger.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  // Create temporary app to get ConfigService
  const tempApp = await NestFactory.create(AppModule, { logger: false });
  const configService = tempApp.get(ConfigService);

  // Create Winston logger
  const winstonLogger = WinstonModule.createLogger(
    createWinstonConfig(
      configService.logLevel,
      configService.isDevelopment,
    ),
  );

  // Close temporary app
  await tempApp.close();

  // Create main app with Winston logger
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  // Get actual config service from main app
  const config = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filters
  app.useGlobalFilters(
    new AllExceptionsFilter(winstonLogger),
    new PrismaExceptionFilter(winstonLogger),
  );

  // CORS configuration
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  // Setup Swagger API documentation
  setupSwagger(app, config);

  // Start server
  const port = config.backendPort;
  await app.listen(port);

  winstonLogger.log(`🚀 Server running on ${config.backendUrl}`);
  winstonLogger.log(`📊 Environment: ${config.nodeEnv}`);
  winstonLogger.log(`🗄️  Database: Connected`);
  winstonLogger.log(`🔴 Redis: Connected`);
}

bootstrap();
