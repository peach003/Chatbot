import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './cache/cache.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [CommonModule, CacheModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
