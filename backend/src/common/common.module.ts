import { Global, Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaService } from './prisma.service';

/**
 * Global Common Module
 * Provides shared services, configuration, and utilities
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService, ConfigModule],
})
export class CommonModule {}
