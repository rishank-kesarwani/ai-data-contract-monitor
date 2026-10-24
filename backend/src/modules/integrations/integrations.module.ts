import { Module, Global } from '@nestjs/common';
import { AiPlatformAdapter } from './ai-platform.adapter';
import { NotificationAdapter } from './notification.adapter';
import { RedisAdapter } from './redis.adapter';

@Global()
@Module({
  providers: [AiPlatformAdapter, NotificationAdapter, RedisAdapter],
  exports: [AiPlatformAdapter, NotificationAdapter, RedisAdapter],
})
export class IntegrationsModule {}
