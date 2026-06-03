import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DevController],
})
export class DevModule {}
