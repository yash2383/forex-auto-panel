import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationDeliveryStatus,
  NotificationChannel,
} from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { ObservabilityService } from '../observability/observability.service';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly observabilityService: ObservabilityService,
  ) { }

  /**
   * Run cleanup, archiving, and daily analytics builder at 00:00 (midnight) daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyMaintenance() {
    this.logger.log('Starting Notification System Daily Maintenance...');
    await this.cleanupExpiredTokens();
    await this.archiveOldNotifications();
    await this.aggregateDailyAnalytics();
    await this.cleanupExpiredAudits();
    this.logger.log('Notification System Daily Maintenance complete.');
  }

  /**
   * 1. Clean inactive tokens or tokens failing more than 3 times
   */
  private async cleanupExpiredTokens() {
    try {
      this.logger.log('Cleaning up inactive device tokens...');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await this.prisma.deviceToken.deleteMany({
        where: {
          OR: [
            { failureCount: { gte: 3 } },
            { isActive: false, createdAt: { lt: thirtyDaysAgo } },
          ],
        },
      });

      this.logger.log(`Pruned ${deletedCount.count} expired device tokens.`);
    } catch (err) {
      this.logger.error('Failed to cleanup expired device tokens', err.stack);
    }
  }

  /**
   * 2. Archive notifications older than 180 days
   * Implementation order: Copy -> Verify success -> Delete original
   */
  private async archiveOldNotifications() {
    try {
      this.logger.log('Archiving notifications older than 180 days...');
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 180);

      // Find old notifications
      const oldNotifications = await this.prisma.notification.findMany({
        where: {
          createdAt: { lt: limitDate },
        },
        take: 1000, // Batch it to avoid memory exhaustion
      });

      if (oldNotifications.length === 0) {
        this.logger.log('No notifications found to archive.');
        return;
      }

      this.logger.log(
        `Found ${oldNotifications.length} notifications to archive. Copying...`,
      );

      // Copy using transaction
      await this.prisma.$transaction(async (tx) => {
        // Prepare archive records
        const archives = oldNotifications.map((notif) => ({
          id: notif.id,
          userId: notif.userId,
          adminId: notif.adminId,
          partnerId: notif.partnerId,
          title: notif.title,
          body: notif.body,
          type: notif.type,
          priority: notif.priority,
          severity: notif.severity,
          category: notif.category,
          status: notif.status,
          link: notif.link,
          idempotencyKey: notif.idempotencyKey,
          metadata: notif.metadata || undefined,
          createdAt: notif.createdAt,
        }));

        // Batch insert archives
        await tx.notificationArchive.createMany({
          data: archives,
          skipDuplicates: true, // safe if ran multiple times
        });

        // Delete from original table (cascades to NotificationRead, NotificationDelivery, NotificationAction)
        const deleteResult = await tx.notification.deleteMany({
          where: {
            id: {
              in: oldNotifications.map((n) => n.id),
            },
          },
        });

        this.logger.log(
          `Successfully archived and deleted ${deleteResult.count} notifications.`,
        );
      });
    } catch (err) {
      this.logger.error('Failed to archive old notifications', err.stack);
    }
  }

  /**
   * 3. Aggregate Yesterday's Analytics per Partner
   */
  private async aggregateDailyAnalytics() {
    try {
      this.logger.log("Building yesterday's daily analytics...");
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
      const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

      // Get all active partners to group analytics
      const partners = await this.prisma.partner.findMany({
        select: { id: true },
      });
      const partnerIds = [null, ...partners.map((p) => p.id)];

      for (const partnerId of partnerIds) {
        // Fetch counts for this partner from yesterday's notifications and deliveries
        const metrics = await this.prisma.notificationDelivery.groupBy({
          by: ['channel', 'status'],
          where: {
            createdAt: {
              gte: startOfYesterday,
              lte: endOfYesterday,
            },
            notification: {
              partnerId: partnerId,
            },
          },
          _count: {
            _all: true,
          },
        });

        // Aggregate channel sends & failures
        let pushSent = 0;
        let emailSent = 0;
        let bellSent = 0;
        let socketSent = 0;
        let smsSent = 0;
        let failed = 0;

        for (const metric of metrics) {
          const count = metric._count._all;
          if (metric.status === NotificationDeliveryStatus.FAILED) {
            failed += count;
          } else if (
            metric.status === NotificationDeliveryStatus.DELIVERED ||
            metric.status === NotificationDeliveryStatus.SENT
          ) {
            if (metric.channel === NotificationChannel.PUSH) pushSent += count;
            if (metric.channel === NotificationChannel.EMAIL)
              emailSent += count;
            if (metric.channel === NotificationChannel.BELL) bellSent += count;
            if (metric.channel === NotificationChannel.SOCKET)
              socketSent += count;
            if (metric.channel === NotificationChannel.SMS) smsSent += count;
          }
        }

        // Aggregate User Action Metrics (opens, clicks, reads, dismissals)
        const readCount = await this.prisma.notificationRead.count({
          where: {
            readAt: {
              gte: startOfYesterday,
              lte: endOfYesterday,
            },
            notification: {
              partnerId: partnerId,
            },
          },
        });

        const actionMetrics = await this.prisma.notificationAction.groupBy({
          by: ['actionType'],
          where: {
            clickedAt: {
              gte: startOfYesterday,
              lte: endOfYesterday,
            },
            notification: {
              partnerId: partnerId,
            },
          },
          _count: {
            _all: true,
          },
        });

        let opened = 0;
        let clicked = 0;
        let dismissed = 0;

        for (const action of actionMetrics) {
          const count = action._count._all;
          if (action.actionType === 'OPENED') opened += count;
          if (action.actionType === 'CLICKED') clicked += count;
          if (action.actionType === 'DISMISSED') dismissed += count;
        }

        // Upsert into analytics
        await this.prisma.notificationAnalytics.upsert({
          where: partnerId
            ? { partnerId_date: { partnerId, date: startOfYesterday } }
            : { date: startOfYesterday },
          update: {
            pushSent,
            emailSent,
            bellSent,
            socketSent,
            smsSent,
            opened,
            clicked,
            read: readCount,
            dismissed,
            failed,
          },
          create: {
            partnerId,
            date: startOfYesterday,
            pushSent,
            emailSent,
            bellSent,
            socketSent,
            smsSent,
            opened,
            clicked,
            read: readCount,
            dismissed,
            failed,
          },
        });
      }

      this.logger.log("Successfully compiled yesterday's analytics.");
    } catch (err) {
      this.logger.error("Failed to compile yesterday's analytics", err.stack);
    }
  }

  /**
   * 4. Audit Retention Policy: Purge audits older than 730 days
   */
  private async cleanupExpiredAudits() {
    try {
      this.logger.log(
        'Cleaning up expired admin action audits (older than 730 days)...',
      );
      const twoYearsAgo = new Date();
      twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);

      const result = await this.prisma.notificationAdminAudit.deleteMany({
        where: {
          createdAt: { lt: twoYearsAgo },
        },
      });

      this.logger.log(`Pruned ${result.count} expired admin audit logs.`);
    } catch (err) {
      this.logger.error(
        'Failed to cleanup expired admin audit logs',
        err.stack,
      );
    }
  }

  /**
   * Stuck Broadcast Recovery: Check every 15 minutes for broadcasts in SENDING status
   * that have not logged a heartbeat in the last 1 hour.
   */
  @Cron('0 */15 * * * *')
  async handleStuckBroadcasts() {
    try {
      this.logger.log('Checking for stuck broadcasts...');
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const stuckExecutions = await this.prisma.broadcastExecution.findMany({
        where: {
          completedAt: null,
          lastHeartbeatAt: { lt: oneHourAgo },
          broadcast: { status: 'SENDING' },
        },
      });

      if (stuckExecutions.length === 0) {
        this.logger.log('No stuck executions found.');
        return;
      }

      this.logger.warn(
        `Found ${stuckExecutions.length} stuck executions. Restoring...`,
      );

      for (const exec of stuckExecutions) {
        await this.prisma.broadcastExecution.update({
          where: { id: exec.id },
          data: { completedAt: new Date() },
        });

        await this.prisma.notificationBroadcast.update({
          where: { id: exec.broadcastId },
          data: { status: 'PARTIALLY_FAILED', completedAt: new Date() },
        });

        this.logger.warn(
          `Broadcast ${exec.broadcastId} marked as PARTIALLY_FAILED due to lack of heartbeat.`,
        );
      }
    } catch (err) {
      this.logger.error(
        'Failed to process stuck broadcasts recovery check',
        err.stack,
      );
    }
  }

  /**
   * Pending Deliveries Reconciliation: Scan and re-enqueue any PENDING PUSH, EMAIL, or SMS deliveries.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcilePendingDeliveries() {
    if (!this.notificationsService.isRedisReady()) {
      this.logger.warn('Redis client is not ready. Skipping pending deliveries reconciliation.');
      return;
    }

    const startTime = Date.now();
    this.observabilityService.increment('notification_reconciliation_runs_total');
    try {
      this.logger.log('Starting reconciliation of pending deliveries...');
      const twoMinutesAgo = new Date();
      twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

      const pendingDeliveries = await this.prisma.notificationDelivery.findMany(
        {
          where: {
            status: 'PENDING',
            createdAt: { lt: twoMinutesAgo },
            channel: { in: ['PUSH', 'EMAIL', 'SMS'] },
          },
          select: { id: true },
          take: 500,
        },
      );

      if (pendingDeliveries.length === 0) {
        this.logger.log('No pending deliveries found to reconcile.');
        const durationSeconds = (Date.now() - startTime) / 1000;
        this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
        return;
      }

      this.logger.log(
        `Found ${pendingDeliveries.length} pending deliveries. Re-enqueuing...`,
      );
      const deliveryIds = pendingDeliveries.map((d) => d.id);
      let result;
      try {
        result = await this.notificationsService.bulkRetryDeliveries(deliveryIds);
      } catch (err: any) {
        this.logger.error(
          'Notification reconciliation failed',
          err.stack,
        );
        this.observabilityService.increment('notification_reconciliation_failures_total');
        const durationSeconds = (Date.now() - startTime) / 1000;
        this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
        return;
      }

      this.logger.log(
        `Reconciled ${result.count}/${deliveryIds.length} pending deliveries successfully.`,
      );
      const durationSeconds = (Date.now() - startTime) / 1000;
      this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
    } catch (err) {
      this.logger.error('Failed to reconcile pending deliveries', err.stack);
      this.observabilityService.increment('notification_reconciliation_failures_total');
      const durationSeconds = (Date.now() - startTime) / 1000;
      this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
    }
  }

  /**
   * PaymentInitiation Stuck Recovery: Scan every 5 minutes for payment initiations in 'processing' status
   * that have been stuck for over 10 minutes and have no completed payment record.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleStuckPaymentInitiations() {
    try {
      this.logger.log('Checking for stuck payment initiations...');
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

      // Find PIs that are stuck in 'processing' status for more than 10 minutes,
      // and do not have an associated Payment record.
      const stuckPIs = await this.prisma.paymentInitiation.findMany({
        where: {
          status: 'processing',
          updatedAt: { lt: tenMinutesAgo }, // Race-condition guard
          payment: null, // ensures no linked Payment was successfully written
        },
      });

      if (stuckPIs.length === 0) {
        this.logger.log('No stuck payment initiations found.');
        return;
      }

      this.logger.warn(
        `Found ${stuckPIs.length} stuck payment initiations. Resetting...`,
      );

      const result = await this.prisma.paymentInitiation.updateMany({
        where: {
          id: { in: stuckPIs.map((pi) => pi.id) },
          status: 'processing',
          updatedAt: { lt: tenMinutesAgo },
        },
        data: {
          status: 'initiated',
          processingAt: null,
        },
      });

      this.logger.warn(
        `Successfully reset ${result.count} stuck payment initiations back to 'initiated'.`,
      );
    } catch (err) {
      this.logger.error(
        'Failed to process stuck payment initiations recovery check',
        err.stack,
      );
    }
  }
}
