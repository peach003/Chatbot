import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './cache/cache.module';
import { CommonModule } from './common/common.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [CommonModule, CacheModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
