import { Processor, Process } from '@nestjs/bull';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
import { sendFcmMessage } from './firebase-admin';

// =========================================================================
// HELPERS
// =========================================================================

async function handleDeliveryFailure(
  prisma: PrismaService,
  dlqQueue: Queue,
  logger: Logger,
  job: Job<any>,
  deliveryId: string,
  queueName: string,
  error: Error,
) {
  const maxAttempts = job.opts.attempts || 5;
  const isFinalAttempt = job.attemptsMade >= maxAttempts;

  logger.error(
    `Delivery failure for job ${job.id} (Attempt ${job.attemptsMade}/${maxAttempts}) in queue ${queueName}: ${error.message}`,
  );

  // Update database status
  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      status: isFinalAttempt
        ? NotificationDeliveryStatus.FAILED
        : NotificationDeliveryStatus.PENDING,
      error: error.message,
    },
  });

  // If final attempt failed, route to DLQ
  if (isFinalAttempt) {
    logger.warn(`Job ${job.id} exceeded max attempts. Routing to notifications-dlq.`);
    try {
      await dlqQueue.add('failed-job', {
        notificationId: job.data.notificationId,
        originalQueue: queueName,
        attempts: job.attemptsMade,
        error: error.message,
        payload: job.data,
        failedAt: new Date(),
      });
    } catch (dlqErr) {
      logger.error(`Failed to route job ${job.id} to DLQ queue: ${dlqErr.message}`);
    }
  }
}

// =========================================================================
// PROCESSORS
// =========================================================================

@Processor('notifications-push')
export class PushProcessor {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications-dlq') private readonly dlqQueue: Queue,
  ) {}

  @Process('deliver')
  async handleDelivery(job: Job<any>) {
    const { deliveryId, notificationId, userId, title, body, link, payload } = job.data;
    this.logger.log(`Processing push job ${job.id} for delivery: ${deliveryId}`);

    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.status === NotificationDeliveryStatus.DELIVERED) {
      return;
    }

    try {
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          retryCount: delivery.retryCount + 1,
          lastRetryAt: new Date(),
        },
      });

      // Execute FCM Push driver
      await this.sendPushNotification(userId, title, body, link, payload);

      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    } catch (err) {
      await handleDeliveryFailure(
        this.prisma,
        this.dlqQueue,
        this.logger,
        job,
        deliveryId,
        'notifications-push',
        err,
      );
      throw err;
    }
  }

  private async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    link: string,
    payload: Record<string, any>,
  ) {
    if (!userId) return;

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
    });

    if (tokens.length === 0) {
      this.logger.log(`No active device tokens found for user ${userId}. Push skipped.`);
      return;
    }

    for (const device of tokens) {
      try {
        this.logger.log(`Sending FCM push to token ${device.token.substring(0, 10)}... for user ${userId}`);
        
        // Execute real FCM dispatch
        await sendFcmMessage(device.token, title, body, {
          link: link || '',
          ...payload,
        });

        await this.prisma.deviceToken.update({
          where: { id: device.id },
          data: { lastUsedAt: new Date() },
        });
      } catch (err: any) {
        this.logger.error(`FCM send failed for token ${device.id}: ${err.message}`);
        
        const isBadToken =
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered' ||
          err.message?.includes('not registered') ||
          err.message?.includes('invalid');

        if (isBadToken) {
          this.logger.warn(`Deactivating invalid FCM token: ${device.id}`);
          await this.prisma.deviceToken.update({
            where: { id: device.id },
            data: {
              isActive: false,
              failureCount: { increment: 1 },
            },
          });
        }
      }
    }
  }
}

@Processor('notifications-email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications-dlq') private readonly dlqQueue: Queue,
  ) {}

  @Process('deliver')
  async handleDelivery(job: Job<any>) {
    const { deliveryId, notificationId, userId, title, body, link, payload } = job.data;
    this.logger.log(`Processing email job ${job.id} for delivery: ${deliveryId}`);

    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.status === NotificationDeliveryStatus.DELIVERED) {
      return;
    }

    try {
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          retryCount: delivery.retryCount + 1,
          lastRetryAt: new Date(),
        },
      });

      // Execute Email driver
      await this.sendEmailNotification(userId, title, body, link, payload);

      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    } catch (err) {
      await handleDeliveryFailure(
        this.prisma,
        this.dlqQueue,
        this.logger,
        job,
        deliveryId,
        'notifications-email',
        err,
      );
      throw err;
    }
  }

  private async sendEmailNotification(
    userId: string,
    title: string,
    body: string,
    link: string,
    payload: Record<string, any>,
  ) {
    if (!userId) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      throw new Error(`Email address not found for user ${userId}`);
    }

    this.logger.log(`Sending email to ${user.email} (Subject: ${title})`);
  }
}

@Processor('notifications-socket')
export class SocketProcessor {
  private readonly logger = new Logger(SocketProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
    @InjectQueue('notifications-dlq') private readonly dlqQueue: Queue,
  ) {}

  @Process('deliver')
  async handleDelivery(job: Job<any>) {
    const { deliveryId, notificationId, channel, userId, title, body, link, payload } = job.data;
    this.logger.log(`Processing socket job ${job.id} for delivery: ${deliveryId}`);

    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      include: { notification: true },
    });

    if (!delivery || delivery.status === NotificationDeliveryStatus.DELIVERED) {
      return;
    }

    try {
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          retryCount: delivery.retryCount + 1,
          lastRetryAt: new Date(),
        },
      });

      // Emit over WebSocket Gateway
      const targetRoomId = userId
        ? `user-${userId}`
        : delivery.notification.adminId
          ? `user-${delivery.notification.adminId}`
          : null;

      if (targetRoomId && this.gateway.server) {
        this.gateway.server.to(targetRoomId).emit('notification', {
          id: notificationId,
          title,
          body,
          type: delivery.notification.type,
          severity: delivery.notification.severity,
          category: delivery.notification.category,
          link,
          createdAt: delivery.notification.createdAt,
          showToast: channel === NotificationChannel.TOAST,
        });
      }

      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    } catch (err) {
      await handleDeliveryFailure(
        this.prisma,
        this.dlqQueue,
        this.logger,
        job,
        deliveryId,
        'notifications-socket',
        err,
      );
      throw err;
    }
  }
}

@Processor('notifications-sms')
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications-dlq') private readonly dlqQueue: Queue,
  ) {}

  @Process('deliver')
  async handleDelivery(job: Job<any>) {
    const { deliveryId, notificationId, userId, title, body, payload } = job.data;
    this.logger.log(`Processing SMS job ${job.id} for delivery: ${deliveryId}`);

    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.status === NotificationDeliveryStatus.DELIVERED) {
      return;
    }

    try {
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          retryCount: delivery.retryCount + 1,
          lastRetryAt: new Date(),
        },
      });

      // Execute SMS driver
      await this.sendSmsNotification(userId, title, body, payload);

      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    } catch (err) {
      await handleDeliveryFailure(
        this.prisma,
        this.dlqQueue,
        this.logger,
        job,
        deliveryId,
        'notifications-sms',
        err,
      );
      throw err;
    }
  }

  private async sendSmsNotification(
    userId: string,
    title: string,
    body: string,
    payload: Record<string, any>,
  ) {
    if (!userId) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user || !user.phone) {
      this.logger.log(`No phone number registered for user ${userId}. SMS skipped.`);
      return;
    }

    this.logger.log(`Sending SMS to ${user.phone}: ${body.substring(0, 30)}...`);
  }
}

@Processor('notifications-dlq')
export class DlqProcessor {
  private readonly logger = new Logger(DlqProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('failed-job')
  async handleFailedJob(job: Job<any>) {
    const { notificationId, originalQueue, error, failedAt } = job.data;
    this.logger.warn(
      `DLQ Job logged: Notification ${notificationId} failed completely in queue ${originalQueue}. Reason: ${error} at ${failedAt}`,
    );
  }
}
