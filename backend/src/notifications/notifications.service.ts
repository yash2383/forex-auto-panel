import { Injectable, Logger, Inject, forwardRef, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  NotificationEvent,
  NotificationChannel,
  NotificationPriority,
  NotificationSeverity,
  NotificationCategory,
  NotificationStatus,
  NotificationDeliveryStatus,
  NotificationAudience,
  BroadcastStatus,
  NotificationScheduleStatus,
  Prisma,
} from '@prisma/client';
import { EVENT_REGISTRY } from './events';
import { EVENT_ROUTES } from './routes';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications-push') private readonly pushQueue: Queue,
    @InjectQueue('notifications-email') private readonly emailQueue: Queue,
    @InjectQueue('notifications-socket') private readonly socketQueue: Queue,
    @InjectQueue('notifications-sms') private readonly smsQueue: Queue,
    @InjectQueue('notifications-dlq') private readonly dlqQueue: Queue,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Helper to compile simple Handlebars-like templates
   */
  private compileTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Main dispatch method
   */
  async send(
    event: NotificationEvent,
    payload: Record<string, any>,
    userId?: string,
    partnerId?: string,
    idempotencyKey?: string,
    adminId?: string,
    customTitle?: string,
    customBody?: string,
    customChannels?: NotificationChannel[],
  ) {
    const eventDef = EVENT_REGISTRY[event];
    if (!eventDef) {
      throw new Error(`Event ${event} is not registered in EVENT_REGISTRY.`);
    }

    // 1. Check Idempotency Key
    if (idempotencyKey) {
      const existing = await this.prisma.notification.findUnique({
        where: { idempotencyKey },
        include: { deliveries: true },
      });
      if (existing) {
        this.logger.log(`Duplicate notification ignored for idempotencyKey: ${idempotencyKey}`);
        return existing;
      }
    }

    // Compile templates
    const title = customTitle || this.compileTemplate(eventDef.title, payload);
    const body = customBody || this.compileTemplate(eventDef.body, payload);
    const link = EVENT_ROUTES[event] || '/dashboard';

    // 2. Fetch Admin global event overrides
    const eventSettings = await this.prisma.notificationEventSetting.findUnique({
      where: { event },
    });

    let allowedChannels = customChannels || [...eventDef.channels];

    if (eventSettings) {
      allowedChannels = allowedChannels.filter(channel => {
        if (channel === NotificationChannel.PUSH) return eventSettings.pushEnabled;
        if (channel === NotificationChannel.EMAIL) return eventSettings.emailEnabled;
        if (channel === NotificationChannel.BELL) return eventSettings.bellEnabled;
        if (channel === NotificationChannel.SOCKET) return eventSettings.socketEnabled;
        if (channel === NotificationChannel.SMS) return eventSettings.smsEnabled;
        return true;
      });
    }

    // 2.5 Fetch User preferences if userId is provided
    if (userId) {
      const userPrefs = await this.prisma.userNotificationPreference.findMany({
        where: { userId, category: eventDef.category },
      });

      const isPushEnabled = userPrefs.find(p => p.category === eventDef.category)?.pushEnabled ?? true;
      const isEmailEnabled = userPrefs.find(p => p.category === eventDef.category)?.emailEnabled ?? true;
      const isBellEnabled = userPrefs.find(p => p.category === eventDef.category)?.bellEnabled ?? true;

      const bypassOptOut =
        eventDef.priority === NotificationPriority.CRITICAL ||
        eventDef.priority === NotificationPriority.HIGH;

      if (!bypassOptOut) {
        allowedChannels = allowedChannels.filter(channel => {
          if (channel === NotificationChannel.PUSH) return isPushEnabled;
          if (channel === NotificationChannel.EMAIL) return isEmailEnabled;
          if (channel === NotificationChannel.BELL) return isBellEnabled;
          return true; // Toast/Socket are generally system level
        });
      }
    }

    // 3. Create Notification in Database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        adminId,
        partnerId,
        title,
        body,
        type: event,
        priority: eventDef.priority,
        severity: eventDef.severity,
        category: eventDef.category,
        status: NotificationStatus.UNREAD,
        link,
        idempotencyKey,
        metadata: payload as Prisma.JsonObject,
      },
    });

    // 4. Create Pending Deliveries
    const deliveryCreates = allowedChannels.map(channel =>
      this.prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel,
          status: NotificationDeliveryStatus.PENDING,
        },
      }),
    );
    const deliveries = await Promise.all(deliveryCreates);

    // 5. Dispatch real-time Socket and Toast immediately if allowed (and mark delivered)
    const socketDelivery = deliveries.find(d => d.channel === NotificationChannel.SOCKET);
    const toastDelivery = deliveries.find(d => d.channel === NotificationChannel.TOAST);
    const bellDelivery = deliveries.find(d => d.channel === NotificationChannel.BELL);

    const targetRoomId = userId ? `user-${userId}` : adminId ? `user-${adminId}` : null;
    if (targetRoomId) {
      if (socketDelivery || toastDelivery || bellDelivery) {
        try {
          if (this.gateway.server) {
            this.gateway.server.to(targetRoomId).emit('notification', {
              id: notification.id,
              title,
              body,
              type: event,
              severity: eventDef.severity,
              category: eventDef.category,
              link,
              createdAt: notification.createdAt,
              showToast: !!toastDelivery,
            });

            // Update status immediately for real-time
            await this.prisma.notificationDelivery.updateMany({
              where: {
                id: {
                  in: [socketDelivery?.id, toastDelivery?.id, bellDelivery?.id].filter(Boolean) as string[],
                },
              },
              data: {
                status: NotificationDeliveryStatus.DELIVERED,
                deliveredAt: new Date(),
              },
            });
          }
        } catch (err) {
          this.logger.error(`Realtime socket emission failed for room ${targetRoomId}`, err.stack);
          await this.prisma.notificationDelivery.updateMany({
            where: {
              id: {
                in: [socketDelivery?.id, toastDelivery?.id, bellDelivery?.id].filter(Boolean) as string[],
              },
            },
            data: {
              status: NotificationDeliveryStatus.FAILED,
              error: err.message,
            },
          });
        }
      }
    }

    // 6. Queue Async Deliveries (Push, Email, SMS) with fallback
    for (const delivery of deliveries) {
      if (
        delivery.channel === NotificationChannel.PUSH ||
        delivery.channel === NotificationChannel.EMAIL ||
        delivery.channel === NotificationChannel.SMS
      ) {
        try {
          let targetQueue: Queue;
          if (delivery.channel === NotificationChannel.PUSH) targetQueue = this.pushQueue;
          else if (delivery.channel === NotificationChannel.EMAIL) targetQueue = this.emailQueue;
          else targetQueue = this.smsQueue;

          const addPromise = targetQueue.add(
            'deliver',
            {
              deliveryId: delivery.id,
              notificationId: notification.id,
              channel: delivery.channel,
              userId,
              title,
              body,
              link,
              payload,
            },
            {
              attempts: 5,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
            },
          );

          const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Queue timeout (Redis offline)')), 2000),
          );

          await Promise.race([addPromise, timeoutPromise]);
        } catch (queueErr) {
          this.logger.warn(
            `Failed to enqueue delivery job for ${delivery.channel} (${queueErr.message}). Attempting synchronous dispatch fallback.`,
          );
          await this.fallbackSyncDispatch(delivery.id, notification.id, delivery.channel, userId, title, body, link, payload);
        }
      }
    }

    return notification;
  }

  /**
   * Synchronous fallback dispatch when Redis/Bull queue is offline
   */
  private async fallbackSyncDispatch(
    deliveryId: string,
    notificationId: string,
    channel: NotificationChannel,
    userId: string | null | undefined,
    title: string,
    body: string,
    link: string,
    payload: Record<string, any>,
  ) {
    // Redis offline: only handle Bell & Socket. Leave Push, Email, SMS PENDING in DB.
    if (
      channel !== NotificationChannel.BELL &&
      channel !== NotificationChannel.SOCKET &&
      channel !== NotificationChannel.TOAST
    ) {
      this.logger.log(
        `Redis offline: Leaving async delivery ${deliveryId} (${channel}) in PENDING status for reconciliation.`,
      );
      return;
    }

    try {
      this.logger.log(`Executing sync fallback dispatch for delivery: ${deliveryId} (${channel})`);
      
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { retryCount: { increment: 1 }, lastRetryAt: new Date() },
      });

      if (channel === NotificationChannel.SOCKET || channel === NotificationChannel.TOAST) {
        const targetRoomId = userId ? `user-${userId}` : null;
        if (targetRoomId && this.gateway.server) {
          this.gateway.server.to(targetRoomId).emit('notification', {
            id: notificationId,
            title,
            body,
            link,
            showToast: channel === NotificationChannel.TOAST,
            createdAt: new Date(),
          });
        }
      }

      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(`Sync fallback dispatch failed for delivery ${deliveryId}`, err.stack);
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: NotificationDeliveryStatus.FAILED,
          error: `Queue failure + Sync Fallback failure: ${err.message}`,
        },
      });
    }
  }

  /**
   * Send to user helper
   */
  async sendToUser(userId: string, event: NotificationEvent, payload: Record<string, any>, idempotencyKey?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { partnerId: true },
    });
    return this.send(event, payload, userId, user?.partnerId, idempotencyKey);
  }

  /**
   * Send to admin helper
   */
  async sendToAdmin(adminId: string, event: NotificationEvent, payload: Record<string, any>, idempotencyKey?: string) {
    return this.send(event, payload, undefined, undefined, idempotencyKey, adminId);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ── AUDIT LOGGING HELPER ──────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────

  async logAdminAudit(
    adminId: string,
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.notificationAdminAudit.create({
        data: {
          adminId,
          action,
          entityType,
          entityId,
          metadata: metadata ? (metadata as Prisma.JsonObject) : undefined,
          ipAddress,
          userAgent,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to log admin audit for action ${action}: ${err.message}`, err.stack);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ── ADMIN OPERATIONS ──────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fetch admin analytics
   */
  async getAdminAnalytics() {
    const analytics = await this.prisma.notificationAnalytics.findMany({
      orderBy: { date: 'asc' },
    });

    if (analytics.length === 0) {
      return {
        hasData: false,
        metrics: [],
        message: 'No analytics data available yet',
      };
    }

    const totalSent = await this.prisma.notificationDelivery.count();
    const totalFailed = await this.prisma.notificationDelivery.count({ where: { status: 'FAILED' } });
    const totalRead = await this.prisma.notification.count({ where: { status: 'READ' } });
    const totalNotifications = await this.prisma.notification.count();
    const openRate = totalNotifications > 0 ? (totalRead / totalNotifications) * 100 : 0;

    const channelSent = {
      push: await this.prisma.notificationDelivery.count({ where: { channel: 'PUSH' } }),
      email: await this.prisma.notificationDelivery.count({ where: { channel: 'EMAIL' } }),
      bell: await this.prisma.notificationDelivery.count({ where: { channel: 'BELL' } }),
      socket: await this.prisma.notificationDelivery.count({ where: { channel: 'SOCKET' } }),
      sms: await this.prisma.notificationDelivery.count({ where: { channel: 'SMS' } }),
    };

    return {
      hasData: true,
      metrics: analytics,
      summary: {
        totalSent,
        totalFailed,
        totalRead,
        openRate: parseFloat(openRate.toFixed(1)),
        channelSent,
      },
    };
  }

  /**
   * Fetch archive stats
   */
  async getArchiveStats() {
    const activeNotifications = await this.prisma.notification.count({
      where: { deletedAt: null },
    });
    const archivedNotifications = await this.prisma.notification.count({
      where: { deletedAt: { not: null } },
    });
    const total = activeNotifications + archivedNotifications;
    const archiveRatio = total > 0 ? (archivedNotifications / total) * 100 : 0;

    return {
      activeNotifications,
      archivedNotifications,
      archiveRatio: parseFloat(archiveRatio.toFixed(1)),
    };
  }

  /**
   * Resolve users matching targeted audience cohort
   */
  async resolveAudienceUsers(audience: NotificationAudience): Promise<{ id: string; partnerId?: string }[]> {
    if (audience === NotificationAudience.ALL_USERS) {
      return this.prisma.user.findMany({
        where: { isDeleted: false },
        select: { id: true, partnerId: true },
      });
    }

    if (audience === NotificationAudience.ACTIVE_USERS) {
      return this.prisma.user.findMany({
        where: { isDeleted: false, status: 'ACTIVE' },
        select: { id: true, partnerId: true },
      });
    }

    if (audience === NotificationAudience.EXPIRED_USERS) {
      return this.prisma.user.findMany({
        where: { isDeleted: false, status: 'EXPIRED' },
        select: { id: true, partnerId: true },
      });
    }

    if (audience === NotificationAudience.VIP_USERS) {
      return this.prisma.user.findMany({
        where: { isDeleted: false, status: 'VIP' },
        select: { id: true, partnerId: true },
      });
    }

    if (audience === NotificationAudience.CLUB_PLAN) {
      return this.prisma.user.findMany({
        where: {
          isDeleted: false,
          investments: {
            some: {
              status: 'ACTIVE',
              plan: { name: { contains: 'Club', mode: 'insensitive' } },
            },
          },
        },
        select: { id: true, partnerId: true },
      });
    }

    if (audience === NotificationAudience.INDIVIDUAL_PLAN) {
      return this.prisma.user.findMany({
        where: {
          isDeleted: false,
          investments: {
            some: {
              status: 'ACTIVE',
              plan: { name: { contains: 'Individual', mode: 'insensitive' } },
            },
          },
        },
        select: { id: true, partnerId: true },
      });
    }

    if (audience === NotificationAudience.ADMINS) {
      const admins = await this.prisma.admin.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      return admins.map(a => ({ id: a.id, partnerId: undefined }));
    }

    return [];
  }

  /**
   * Preview target audience size
   */
  async previewBroadcast(audience: NotificationAudience) {
    const users = await this.resolveAudienceUsers(audience);
    return {
      resolvedAudience: users.length,
    };
  }

  /**
   * Get detailed audience preview for admin UI recipient panel
   */
  async getAudiencePreviewDetails(audience: NotificationAudience) {
    if (audience === NotificationAudience.ADMINS) {
      const dbAdmins = await this.prisma.admin.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
        }
      });
      
      const resolvedUsers = dbAdmins.map(a => {
        const isOnline = a.lastLoginAt 
          ? (Date.now() - new Date(a.lastLoginAt).getTime()) < 15 * 60 * 1000 
          : false;
          
        return {
          id: a.id,
          name: a.name,
          email: a.email,
          plan: a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Manager',
          status: 'ACTIVE',
          isOnline,
          isVerified: true,
          hasActiveInvestment: false
        };
      });

      return {
        total: resolvedUsers.length,
        online: resolvedUsers.filter(u => u.isOnline).length,
        active: resolvedUsers.length,
        expired: 0,
        users: resolvedUsers
      };
    }

    const userSummary = await this.resolveAudienceUsers(audience);
    const userIds = userSummary.map(u => u.id);

    const dbUsers = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        isVerified: true,
        investments: {
          where: { status: 'ACTIVE' },
          select: {
            plan: {
              select: { name: true }
            }
          }
        }
      }
    });

    const resolvedUsers = dbUsers.map(u => {
      const planName = u.investments[0]?.plan?.name || (u.status === 'VIP' ? 'VIP' : 'Individual');
      const isOnline = u.lastLoginAt 
        ? (Date.now() - new Date(u.lastLoginAt).getTime()) < 15 * 60 * 1000 
        : false;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        plan: planName,
        status: u.status,
        isOnline,
        isVerified: u.isVerified,
        hasActiveInvestment: u.investments.length > 0
      };
    });

    const total = resolvedUsers.length;
    const online = resolvedUsers.filter(u => u.isOnline).length;
    const active = resolvedUsers.filter(u => u.status === 'ACTIVE' || u.status === 'VIP').length;
    const expired = resolvedUsers.filter(u => u.status === 'EXPIRED').length;

    return {
      total,
      online,
      active,
      expired,
      users: resolvedUsers
    };
  }


  /**
   * Create or schedule a broadcast
   */
  async createBroadcast(
    adminId: string,
    payload: {
      title: string;
      body: string;
      audience: NotificationAudience;
      channels: NotificationChannel[];
      scheduledAt?: string;
    },
  ) {
    if (payload.scheduledAt) {
      const schedule = await this.prisma.notificationSchedule.create({
        data: {
          title: payload.title,
          body: payload.body,
          audience: payload.audience,
          scheduledAt: new Date(payload.scheduledAt),
          status: NotificationScheduleStatus.PENDING,
          channels: {
            create: payload.channels.map(c => ({
              channel: c,
            })),
          },
        },
        include: {
          channels: true,
        },
      });
      return { type: 'SCHEDULED', record: schedule };
    }

    const broadcast = await this.prisma.notificationBroadcast.create({
      data: {
        title: payload.title,
        body: payload.body,
        audience: payload.audience,
        status: BroadcastStatus.DRAFT,
        createdByAdminId: adminId,
        channels: {
          create: payload.channels.map(c => ({
            channel: c,
          })),
        },
      },
      include: {
        channels: true,
      },
    });
    return { type: 'BROADCAST', record: broadcast };
  }

  /**
   * Approve and execute broadcast with optimistic locking and 500-user chunking
   */
  async approveAndSendBroadcast(broadcastId: string, adminId: string, approvalRequestId?: string) {
    const broadcast = await this.prisma.notificationBroadcast.findUnique({
      where: { id: broadcastId },
      include: { channels: true },
    });

    if (!broadcast) {
      throw new BadRequestException('Broadcast not found.');
    }

    if (broadcast.status === BroadcastStatus.SENDING || broadcast.status === BroadcastStatus.SENT) {
      if (approvalRequestId && broadcast.approvalRequestId === approvalRequestId) {
        this.logger.log(`Idempotent approval request: Broadcast ${broadcastId} already approved with request ID: ${approvalRequestId}`);
        return { success: true, message: 'Broadcast execution initiated (idempotent).' };
      }
      throw new ConflictException('Broadcast has already been approved or sent.');
    }

    if (broadcast.status !== BroadcastStatus.DRAFT && broadcast.status !== BroadcastStatus.PENDING_APPROVAL) {
      throw new ConflictException('Broadcast is not in draft or pending status.');
    }

    const [updateResult, execution] = await this.prisma.$transaction([
      this.prisma.notificationBroadcast.updateMany({
        where: {
          id: broadcastId,
          status: { in: [BroadcastStatus.DRAFT, BroadcastStatus.PENDING_APPROVAL] },
          version: broadcast.version,
        },
        data: {
          status: BroadcastStatus.SENDING,
          version: { increment: 1 },
          approvedByAdminId: adminId,
          approvedAt: new Date(),
          approvalRequestId: approvalRequestId || null,
        },
      }),
      this.prisma.broadcastExecution.create({
        data: {
          broadcastId,
          startedAt: new Date(),
          targetUsers: 0,
          sentUsers: 0,
          successCount: 0,
          failedCount: 0,
          skippedCount: 0,
          chunkCount: 0,
          lastHeartbeatAt: new Date(),
        },
      }),
    ]);

    if (updateResult.count === 0) {
      throw new ConflictException('Broadcast has already been approved or modified by another admin.');
    }

    this.executeBroadcastChunked(broadcastId, execution.id, broadcast);

    return { success: true, message: 'Broadcast execution initiated.' };
  }

  /**
   * Asynchronously execute broadcast sending in chunks of 500
   */
  private async executeBroadcastChunked(broadcastId: string, executionId: string, broadcast: any) {
    const startTime = Date.now();
    let sentUsers = 0;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let chunkCount = 0;
    let totalUsers = 0;

    try {
      const users = await this.resolveAudienceUsers(broadcast.audience);
      totalUsers = users.length;

      await this.prisma.broadcastExecution.update({
        where: { id: executionId },
        data: { targetUsers: totalUsers, lastHeartbeatAt: new Date() },
      });

      await this.prisma.notificationBroadcast.update({
        where: { id: broadcastId },
        data: { totalUsers, startedAt: new Date() },
      });

      const chunkSize = 500;
      const channels = broadcast.channels.map((bc: any) => bc.channel);

      for (let i = 0; i < users.length; i += chunkSize) {
        chunkCount++;
        const chunk = users.slice(i, i + chunkSize);
        
        await Promise.all(
          chunk.map(async user => {
            try {
              if (broadcast.audience === NotificationAudience.ADMINS) {
                await this.send(
                  NotificationEvent.SYSTEM,
                  {},
                  undefined,
                  undefined,
                  `broadcast_${broadcastId}_${user.id}`,
                  user.id,
                  broadcast.title,
                  broadcast.body,
                  channels,
                );
              } else {
                await this.send(
                  NotificationEvent.SYSTEM,
                  {},
                  user.id,
                  user.partnerId,
                  `broadcast_${broadcastId}_${user.id}`,
                  undefined,
                  broadcast.title,
                  broadcast.body,
                  channels,
                );
              }
              successCount++;
            } catch (err) {
              this.logger.error(`Failed to send broadcast to user ${user.id}`, err);
              failedCount++;
            } finally {
              sentUsers++;
            }
          }),
        );

        // Update progress in database after each chunk
        await this.prisma.broadcastExecution.update({
          where: { id: executionId },
          data: { 
            sentUsers, 
            successCount, 
            failedCount,
            skippedCount,
            chunkCount,
            lastHeartbeatAt: new Date(),
          },
        });

        // Emit real-time progress update to all active admins
        if (this.gateway.server) {
          this.gateway.server.to('admins').emit('broadcast_progress', {
            id: broadcastId,
            sent: sentUsers,
            total: totalUsers,
            percent: Math.round((sentUsers / totalUsers) * 100),
          });
        }

        // Add a slight delay between batches to ensure queue limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const durationMs = Date.now() - startTime;

      // Mark completed
      await this.prisma.broadcastExecution.update({
        where: { id: executionId },
        data: { 
          completedAt: new Date(),
          durationMs,
          lastHeartbeatAt: new Date(),
        },
      });

      await this.prisma.notificationBroadcast.update({
        where: { id: broadcastId },
        data: { status: BroadcastStatus.SENT, sentAt: new Date(), completedAt: new Date() },
      });

      this.logger.log(`Broadcast ${broadcastId} finished execution successfully.`);
    } catch (error) {
      this.logger.error(`Critical error executing broadcast ${broadcastId}:`, error);
      const durationMs = Date.now() - startTime;

      await this.prisma.broadcastExecution.update({
        where: { id: executionId },
        data: { 
          completedAt: new Date(),
          sentUsers,
          successCount,
          failedCount,
          skippedCount,
          chunkCount,
          durationMs,
          lastHeartbeatAt: new Date(),
        },
      });

      await this.prisma.notificationBroadcast.update({
        where: { id: broadcastId },
        data: { status: BroadcastStatus.PARTIALLY_FAILED, completedAt: new Date() },
      });
    }
  }

  /**
   * Device tokens filtered query with cursor-based pagination
   */
  async getAdminDevices(
    filters: {
      userId?: string;
      platform?: string;
      browser?: string;
      isActive?: boolean;
      failureCount?: number;
      lastUsedBefore?: string;
    },
    limit = 50,
    cursor?: string,
  ) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.platform) where.platform = filters.platform;
    if (filters.browser) where.browser = filters.browser;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.failureCount !== undefined) where.failureCount = { gte: Number(filters.failureCount) };
    if (filters.lastUsedBefore) where.lastUsedAt = { lte: new Date(filters.lastUsedBefore) };

    const query: any = {
      where,
      take: limit + 1,
      orderBy: { id: 'asc' },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const devices = await this.prisma.deviceToken.findMany(query);

    let nextCursor: string | undefined = undefined;
    if (devices.length > limit) {
      const nextItem = devices.pop();
      nextCursor = nextItem?.id;
    }

    return {
      devices,
      nextCursor,
    };
  }

  /**
   * Notification deliveries query with cursor-based pagination
   */
  async getAdminDeliveries(
    filters: {
      status?: string;
      channel?: string;
    },
    limit = 50,
    cursor?: string,
  ) {
    const where: any = {};
    if (filters.status) where.status = filters.status as any;
    if (filters.channel) where.channel = filters.channel as any;

    const query: any = {
      where,
      take: limit + 1,
      orderBy: { id: 'desc' },
      include: {
        notification: {
          select: {
            title: true,
            body: true,
            userId: true,
            adminId: true,
            type: true,
          },
        },
      },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const deliveries = await this.prisma.notificationDelivery.findMany(query);

    let nextCursor: string | undefined = undefined;
    if (deliveries.length > limit) {
      const nextItem = deliveries.pop();
      nextCursor = nextItem?.id;
    }

    return {
      deliveries,
      nextCursor,
    };
  }

  /**
   * Bulk retry failed deliveries (Limit 1000)
   */
  async bulkRetryDeliveries(deliveryIds: string[]) {
    const MAX_BULK_RETRY = 1000;
    if (deliveryIds.length > MAX_BULK_RETRY) {
      throw new BadRequestException(`Cannot retry more than ${MAX_BULK_RETRY} deliveries at once.`);
    }

    let count = 0;
    for (const id of deliveryIds) {
      const delivery = await this.prisma.notificationDelivery.findUnique({
        where: { id },
        include: { notification: true },
      });

      if (delivery && (delivery.status === NotificationDeliveryStatus.FAILED || delivery.status === NotificationDeliveryStatus.PENDING)) {
        await this.prisma.notificationDelivery.update({
          where: { id },
          data: { status: NotificationDeliveryStatus.PENDING, error: null },
        });

        let targetQueue: Queue;
        if (delivery.channel === NotificationChannel.PUSH) targetQueue = this.pushQueue;
        else if (delivery.channel === NotificationChannel.EMAIL) targetQueue = this.emailQueue;
        else if (delivery.channel === NotificationChannel.SMS) targetQueue = this.smsQueue;
        else targetQueue = this.socketQueue;

        await targetQueue.add('deliver', {
          deliveryId: delivery.id,
          notificationId: delivery.notificationId,
          channel: delivery.channel,
          userId: delivery.notification.userId,
          title: delivery.notification.title,
          body: delivery.notification.body,
          link: delivery.notification.link,
          payload: delivery.notification.metadata,
        });
        count++;
      }
    }

    return { success: true, count };
  }

  /**
   * Bulk retry failed Bull DLQ jobs
   */
  async bulkRetryDlq() {
    const jobs = await this.dlqQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
    let count = 0;
    for (const job of jobs) {
      const { originalQueue, payload } = job.data;
      if (originalQueue && payload) {
        const targetQueue = this.getQueueByName(originalQueue);
        if (targetQueue) {
          if (payload.deliveryId) {
            await this.prisma.notificationDelivery.update({
              where: { id: payload.deliveryId },
              data: { status: NotificationDeliveryStatus.PENDING, error: null },
            });
          }
          await targetQueue.add('deliver', payload, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
          });
          await job.remove();
          count++;
        }
      }
    }
    return { success: true, count };
  }

  /**
   * Bulk clear failed Bull DLQ jobs
   */
  async bulkClearDlq() {
    const jobs = await this.dlqQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
    for (const job of jobs) {
      await job.remove();
    }
    return { success: true, count: jobs.length };
  }

  private getQueueByName(name: string): Queue | null {
    if (name === 'notifications-push') return this.pushQueue;
    if (name === 'notifications-email') return this.emailQueue;
    if (name === 'notifications-socket') return this.socketQueue;
    if (name === 'notifications-sms') return this.smsQueue;
    return null;
  }

  async getQueueHealth() {
    let redisConnected = false;
    const queues = {
      push: { waiting: 0, active: 0, failed: 0 },
      email: { waiting: 0, active: 0, failed: 0 },
      socket: { waiting: 0, active: 0, failed: 0 },
      sms: { waiting: 0, active: 0, failed: 0 },
      dlq: { waiting: 0, active: 0, failed: 0 },
    };

    try {
      const pushCounts = await this.pushQueue.getJobCounts();
      queues.push = { waiting: pushCounts.waiting, active: pushCounts.active, failed: pushCounts.failed };

      const emailCounts = await this.emailQueue.getJobCounts();
      queues.email = { waiting: emailCounts.waiting, active: emailCounts.active, failed: emailCounts.failed };

      const socketCounts = await this.socketQueue.getJobCounts();
      queues.socket = { waiting: socketCounts.waiting, active: socketCounts.active, failed: socketCounts.failed };

      const smsCounts = await this.smsQueue.getJobCounts();
      queues.sms = { waiting: smsCounts.waiting, active: smsCounts.active, failed: smsCounts.failed };

      const dlqCounts = await this.dlqQueue.getJobCounts();
      queues.dlq = { waiting: dlqCounts.waiting, active: dlqCounts.active, failed: dlqCounts.failed };

      redisConnected = true;
    } catch (err) {
      this.logger.error('Failed to connect to Redis for queue health check:', err);
    }

    const totalWaiting = queues.push.waiting + queues.email.waiting + queues.socket.waiting + queues.sms.waiting + queues.dlq.waiting;
    const totalActive = queues.push.active + queues.email.active + queues.socket.active + queues.sms.active + queues.dlq.active;
    const totalFailed = queues.push.failed + queues.email.failed + queues.socket.failed + queues.sms.failed + queues.dlq.failed;

    return {
      redis: redisConnected ? 'healthy' : 'unhealthy',
      redisConnected,
      push: queues.push,
      email: queues.email,
      socket: queues.socket,
      sms: queues.sms,
      dlq: queues.dlq,
      totals: {
        waiting: totalWaiting,
        active: totalActive,
        failed: totalFailed,
      },
      waiting: totalWaiting,
      active: totalActive,
      completed: 0,
      failed: totalFailed,
      delayed: 0,
    };
  }
}
