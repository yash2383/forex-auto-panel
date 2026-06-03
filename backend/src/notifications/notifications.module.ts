import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  PushProcessor,
  EmailProcessor,
  SocketProcessor,
  SmsProcessor,
  DlqProcessor,
} from './notifications.processor';
import { NotificationsCron } from './notifications.cron';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'notifications-push' },
      { name: 'notifications-email' },
      { name: 'notifications-socket' },
      { name: 'notifications-sms' },
      { name: 'notifications-dlq' },
    ),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    PushProcessor,
    EmailProcessor,
    SocketProcessor,
    SmsProcessor,
    DlqProcessor,
    NotificationsCron,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
