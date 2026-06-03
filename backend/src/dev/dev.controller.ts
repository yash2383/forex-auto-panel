import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEvent } from '@prisma/client';

@Controller('dev')
export class DevController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-notification')
  async testNotification(
    @Body()
    body: {
      event: NotificationEvent;
      payload: Record<string, any>;
      userId: string;
      partnerId?: string;
      idempotencyKey?: string;
    },
  ) {
    return this.notificationsService.send(
      body.event,
      body.payload,
      body.userId,
      body.partnerId,
      body.idempotencyKey,
    );
  }
}
