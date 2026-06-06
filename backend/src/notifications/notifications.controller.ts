import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Query,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationAudience,
  NotificationChannel,
  BroadcastStatus,
  NotificationEvent,
} from '@prisma/client';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';

export enum BroadcastAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getOwnershipClause(reqUser: any) {
    const isAdmin = ['SUPER_ADMIN', 'MANAGER', 'VIEWER'].includes(reqUser.role);
    if (isAdmin) {
      return { adminId: reqUser.id };
    }
    return { userId: reqUser.id };
  }

  @Get()
  async getNotifications(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') pageRaw = '1',
    @Query('limit') limitRaw = '20',
    @Query('status') status?: string,
  ) {
    try {
      const user = (req as any).user;
      const page = Math.max(1, parseInt(pageRaw, 10));
      const limit = Math.max(1, Math.min(100, parseInt(limitRaw, 10)));
      const skip = (page - 1) * limit;

      const ownership = this.getOwnershipClause(user);
      const whereClause: any = {
        ...ownership,
        deletedAt: null,
      };

      if (
        status &&
        Object.values(NotificationStatus).includes(status as NotificationStatus)
      ) {
        whereClause.status = status as NotificationStatus;
      }

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({
          where: whereClause,
        }),
      ]);

      const unreadCount = await this.prisma.notification.count({
        where: {
          ...ownership,
          status: NotificationStatus.UNREAD,
          deletedAt: null,
        },
      });

      return res.json({
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      });
    } catch (error: any) {
      console.error('Fetch notifications error:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Patch('read-all')
  async readAllNotifications(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const ownership = this.getOwnershipClause(user);

      await this.prisma.notification.updateMany({
        where: {
          ...ownership,
          status: NotificationStatus.UNREAD,
          deletedAt: null,
        },
        data: {
          status: NotificationStatus.READ,
        },
      });

      return res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      console.error('Mark read all notifications error:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Patch(':id/read')
  async readNotification(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const ownership = this.getOwnershipClause(user);

      const notification = await this.prisma.notification.findFirst({
        where: {
          id,
          ...ownership,
          deletedAt: null,
        },
      });

      if (!notification) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Notification not found' });
      }

      const updated = await this.prisma.notification.update({
        where: { id },
        data: { status: NotificationStatus.READ },
      });

      return res.json({ success: true, notification: updated });
    } catch (error: any) {
      console.error('Mark read notification error:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const ownership = this.getOwnershipClause(user);

      const notification = await this.prisma.notification.findFirst({
        where: {
          id,
          ...ownership,
          deletedAt: null,
        },
      });

      if (!notification) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Notification not found' });
      }

      await this.prisma.notification.update({
        where: { id },
        data: { deletedAt: new Date(), status: NotificationStatus.ARCHIVED },
      });

      return res.json({
        success: true,
        message: 'Notification soft-deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete notification error:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('preferences')
  async getPreferences(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      if (user.role !== 'USER') {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Preferences only available for user role' });
      }

      const dbPrefs = await this.prisma.userNotificationPreference.findMany({
        where: { userId: user.id },
      });

      const categories = Object.values(NotificationCategory);
      const preferences = categories.map((cat) => {
        const dbPref = dbPrefs.find((p) => p.category === cat);
        return {
          category: cat,
          pushEnabled: dbPref?.pushEnabled ?? true,
          emailEnabled: dbPref?.emailEnabled ?? true,
          bellEnabled: dbPref?.bellEnabled ?? true,
        };
      });

      return res.json({ preferences });
    } catch (error: any) {
      console.error('Fetch preferences error:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Patch('preferences')
  async updatePreferences(
    @Req() req: Request,
    @Body()
    body: {
      category: NotificationCategory;
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      bellEnabled?: boolean;
    },
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      if (user.role !== 'USER') {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Preferences only available for user role' });
      }

      const { category, pushEnabled, emailEnabled, bellEnabled } = body;
      if (
        !category ||
        !Object.values(NotificationCategory).includes(category)
      ) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Invalid category' });
      }

      const existing = await this.prisma.userNotificationPreference.findFirst({
        where: { userId: user.id, category },
      });

      let updated;
      if (existing) {
        updated = await this.prisma.userNotificationPreference.update({
          where: { id: existing.id },
          data: {
            pushEnabled:
              pushEnabled !== undefined ? pushEnabled : existing.pushEnabled,
            emailEnabled:
              emailEnabled !== undefined ? emailEnabled : existing.emailEnabled,
            bellEnabled:
              bellEnabled !== undefined ? bellEnabled : existing.bellEnabled,
          },
        });
      } else {
        updated = await this.prisma.userNotificationPreference.create({
          data: {
            userId: user.id,
            category,
            pushEnabled: pushEnabled ?? true,
            emailEnabled: emailEnabled ?? true,
            bellEnabled: bellEnabled ?? true,
          },
        });
      }

      return res.json({ success: true, preference: updated });
    } catch (error: any) {
      console.error('Update preferences error:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('devices')
  async registerDevice(
    @Req() req: Request,
    @Body() body: { token: string; platform?: string; browser?: string },
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const { token, platform, browser } = body;

      if (!token) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Token is required' });
      }

      const isAdmin = ['SUPER_ADMIN', 'MANAGER', 'VIEWER'].includes(user.role);

      const device = await this.prisma.deviceToken.upsert({
        where: { token },
        update: {
          userId: isAdmin ? null : user.id,
          adminId: isAdmin ? user.id : null,
          platform: platform || 'Web',
          browser: browser || 'Unknown',
          isActive: true,
          failureCount: 0,
          lastUsedAt: new Date(),
        },
        create: {
          token,
          userId: isAdmin ? null : user.id,
          adminId: isAdmin ? user.id : null,
          platform: platform || 'Web',
          browser: browser || 'Unknown',
          isActive: true,
          failureCount: 0,
          lastUsedAt: new Date(),
        },
      });

      return res.json({ success: true, device });
    } catch (error: any) {
      console.error('FCM REGISTER ERROR:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ 
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ── ADMIN CONTROLLERS ─────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────

  @Get('admin/analytics')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getAnalytics(@Res() res: Response) {
    try {
      const stats = await this.notificationsService.getAdminAnalytics();
      return res.json(stats);
    } catch (err: any) {
      console.error('Get admin analytics error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/archive/stats')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getArchiveStats(@Res() res: Response) {
    try {
      const stats = await this.notificationsService.getArchiveStats();
      return res.json(stats);
    } catch (err: any) {
      console.error('Get archive stats error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/health')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getHealth(@Res() res: Response) {
    try {
      const health = await this.notificationsService.getQueueHealth();
      return res.json(health);
    } catch (err: any) {
      console.error('Get queue health error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/broadcasts')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getBroadcasts(@Res() res: Response) {
    try {
      const broadcasts = await this.prisma.notificationBroadcast.findMany({
        include: {
          channels: true,
          createdByAdmin: { select: { name: true, email: true } },
          approvedByAdmin: { select: { name: true } },
          execution: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ broadcasts });
    } catch (err: any) {
      console.error('Get broadcasts error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/audience-preview')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async getAudiencePreview(
    @Query('segment') segment: NotificationAudience,
    @Res() res: Response,
  ) {
    try {
      if (!Object.values(NotificationAudience).includes(segment)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Invalid segment.' });
      }
      const preview =
        await this.notificationsService.getAudiencePreviewDetails(segment);
      return res.json(preview);
    } catch (err: any) {
      console.error('Audience preview details error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('admin/broadcasts/preview')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async previewBroadcast(
    @Body() body: { audience: NotificationAudience },
    @Res() res: Response,
  ) {
    try {
      if (!Object.values(NotificationAudience).includes(body.audience)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Invalid audience.' });
      }
      const preview = await this.notificationsService.previewBroadcast(
        body.audience,
      );
      return res.json(preview);
    } catch (err: any) {
      console.error('Preview broadcast error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('admin/broadcasts')
  @Roles('SUPER_ADMIN', 'MANAGER')
  async createBroadcast(
    @Req() req: Request,
    @Body()
    body: {
      title: string;
      body: string;
      audience: NotificationAudience;
      channels: NotificationChannel[];
      scheduledAt?: string;
    },
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      if (!body.title || !body.body || !body.audience || !body.channels) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Missing required fields.' });
      }
      const result = await this.notificationsService.createBroadcast(
        user.id,
        body,
      );

      // Auditing
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;
      await this.notificationsService.logAdminAudit(
        user.id,
        'CREATE_BROADCAST',
        result.type === 'SCHEDULED' ? 'Schedule' : 'Broadcast',
        result.record.id,
        body,
        ipAddress,
        userAgent,
      );

      return res.json(result);
    } catch (err: any) {
      console.error('Create broadcast error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('admin/broadcasts/:id/action')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles('SUPER_ADMIN', 'MANAGER')
  async handleBroadcastAction(
    @Param('id') id: string,
    @Body() body: { action: BroadcastAction; approvalRequestId?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const { action, approvalRequestId } = body;

      if (!Object.values(BroadcastAction).includes(action)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Invalid action.' });
      }

      const broadcast = await this.prisma.notificationBroadcast.findUnique({
        where: { id },
      });

      if (!broadcast) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Broadcast not found.' });
      }

      if (
        broadcast.status === BroadcastStatus.SENT ||
        broadcast.status === BroadcastStatus.CANCELLED
      ) {
        throw new ConflictException(
          `Cannot execute action on a broadcast that is already ${broadcast.status.toLowerCase()}.`,
        );
      }

      // Auditing metrics
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;

      if (action === BroadcastAction.APPROVE) {
        if (broadcast.status === BroadcastStatus.SENDING) {
          if (
            approvalRequestId &&
            broadcast.approvalRequestId === approvalRequestId
          ) {
            return res.json({
              success: true,
              message: 'Broadcast execution initiated (idempotent).',
            });
          }
          throw new ConflictException(
            'Broadcast has already been approved and is currently sending.',
          );
        }

        const result = await this.notificationsService.approveAndSendBroadcast(
          id,
          user.id,
          approvalRequestId,
        );

        await this.notificationsService.logAdminAudit(
          user.id,
          'APPROVE_BROADCAST',
          'Broadcast',
          id,
          { approvalRequestId },
          ipAddress,
          userAgent,
        );

        return res.json(result);
      }

      if (broadcast.status === BroadcastStatus.SENDING) {
        throw new ConflictException(
          'Cannot cancel or reject a broadcast that is already in progress.',
        );
      }

      const statusMap = {
        [BroadcastAction.REJECT]: BroadcastStatus.REJECTED,
        [BroadcastAction.CANCEL]: BroadcastStatus.CANCELLED,
      };

      await this.prisma.notificationBroadcast.update({
        where: { id },
        data: {
          status: statusMap[action],
          rejectedAt:
            action === BroadcastAction.REJECT ? new Date() : undefined,
          cancelledAt:
            action === BroadcastAction.CANCEL ? new Date() : undefined,
          cancelledByAdminId:
            action === BroadcastAction.CANCEL ? user.id : undefined,
        },
      });

      await this.notificationsService.logAdminAudit(
        user.id,
        action === BroadcastAction.REJECT
          ? 'REJECT_BROADCAST'
          : 'CANCEL_BROADCAST',
        'Broadcast',
        id,
        undefined,
        ipAddress,
        userAgent,
      );

      return res.json({
        success: true,
        message: `Broadcast status updated to ${statusMap[action]}.`,
      });
    } catch (err: any) {
      console.error('Broadcast action error:', err);
      if (err instanceof ConflictException) {
        return res.status(HttpStatus.CONFLICT).json({ message: err.message });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: err.message || 'Internal server error' });
    }
  }

  @Get('admin/devices')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getDevices(
    @Res() res: Response,
    @Query('userId') userId?: string,
    @Query('platform') platform?: string,
    @Query('browser') browser?: string,
    @Query('isActive') isActiveRaw?: string,
    @Query('failureCount') failureCountRaw?: string,
    @Query('lastUsedBefore') lastUsedBefore?: string,
    @Query('limit') limitRaw = '50',
    @Query('cursor') cursor?: string,
  ) {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10)));
      const isActive =
        isActiveRaw !== undefined ? isActiveRaw === 'true' : undefined;
      const failureCount = failureCountRaw
        ? parseInt(failureCountRaw, 10)
        : undefined;

      const result = await this.notificationsService.getAdminDevices(
        { userId, platform, browser, isActive, failureCount, lastUsedBefore },
        limit,
        cursor,
      );
      return res.json(result);
    } catch (err: any) {
      console.error('Get devices error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/deliveries')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getDeliveries(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('limit') limitRaw = '50',
    @Query('cursor') cursor?: string,
  ) {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10)));
      const result = await this.notificationsService.getAdminDeliveries(
        { status, channel },
        limit,
        cursor,
      );
      return res.json(result);
    } catch (err: any) {
      console.error('Get deliveries error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('admin/deliveries/retry')
  @Roles('SUPER_ADMIN')
  async retryDeliveries(
    @Body() body: { deliveryIds: string[] },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      if (!body.deliveryIds || !Array.isArray(body.deliveryIds)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Invalid deliveryIds.' });
      }
      const result = await this.notificationsService.bulkRetryDeliveries(
        body.deliveryIds,
      );

      // Auditing
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;
      await this.notificationsService.logAdminAudit(
        user.id,
        'RETRY_DELIVERIES',
        'Delivery',
        undefined,
        { deliveryIds: body.deliveryIds, affectedCount: result.count },
        ipAddress,
        userAgent,
      );

      return res.json(result);
    } catch (err: any) {
      console.error('Retry deliveries error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: err.message || 'Internal server error' });
    }
  }

  @Post('admin/dlq/retry')
  @Roles('SUPER_ADMIN')
  async retryDlq(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.notificationsService.bulkRetryDlq();

      // Auditing
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;
      await this.notificationsService.logAdminAudit(
        user.id,
        'RETRY_DLQ',
        'Queue',
        undefined,
        { affectedCount: result.count },
        ipAddress,
        userAgent,
      );

      return res.json(result);
    } catch (err: any) {
      console.error('Retry DLQ error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('admin/dlq/clear')
  @Roles('SUPER_ADMIN')
  async clearDlq(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const result = await this.notificationsService.bulkClearDlq();

      // Auditing
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;
      await this.notificationsService.logAdminAudit(
        user.id,
        'CLEAR_DLQ',
        'Queue',
        undefined,
        { affectedCount: result.count },
        ipAddress,
        userAgent,
      );

      return res.json(result);
    } catch (err: any) {
      console.error('Clear DLQ error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/settings')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getSettings(@Res() res: Response) {
    try {
      let global = await this.prisma.notificationGlobalSetting.findFirst();
      if (!global) {
        global = await this.prisma.notificationGlobalSetting.create({
          data: {
            pushEnabled: true,
            emailEnabled: true,
            socketEnabled: true,
            bellEnabled: true,
            toastEnabled: true,
            smsEnabled: false,
          },
        });
      }

      const dbEvents = await this.prisma.notificationEventSetting.findMany();
      const existingMap = new Map(dbEvents.map((s) => [s.event, s]));
      const resultEvents = [];
      const allEvents = Object.values(NotificationEvent);
      for (const event of allEvents) {
        if (existingMap.has(event)) {
          resultEvents.push(existingMap.get(event));
        } else {
          const newSetting = await this.prisma.notificationEventSetting.create({
            data: {
              event,
              enabled: true,
              bellEnabled: true,
              pushEnabled: true,
              emailEnabled: true,
              toastEnabled: true,
              socketEnabled: true,
              smsEnabled: false,
            },
          });
          resultEvents.push(newSetting);
        }
      }
      return res.json({ global, events: resultEvents });
    } catch (err: any) {
      console.error('Fetch settings error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('admin/settings')
  @Roles('SUPER_ADMIN')
  async updateSettings(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const { global, events } = body;

      if (global) {
        const existing =
          await this.prisma.notificationGlobalSetting.findFirst();
        if (existing) {
          await this.prisma.notificationGlobalSetting.update({
            where: { id: existing.id },
            data: {
              pushEnabled: global.pushEnabled,
              emailEnabled: global.emailEnabled,
              socketEnabled: global.socketEnabled,
              bellEnabled: global.bellEnabled,
              toastEnabled: global.toastEnabled,
              smsEnabled: global.smsEnabled,
            },
          });
        }
      }

      if (events && Array.isArray(events)) {
        for (const ev of events) {
          const existingEvent =
            await this.prisma.notificationEventSetting.findUnique({
              where: { event: ev.event },
            });
          if (existingEvent) {
            await this.prisma.notificationEventSetting.update({
              where: { id: existingEvent.id },
              data: {
                enabled: ev.enabled,
                bellEnabled: ev.bellEnabled,
                pushEnabled: ev.pushEnabled,
                emailEnabled: ev.emailEnabled,
                toastEnabled: ev.toastEnabled,
                socketEnabled: ev.socketEnabled,
                smsEnabled: ev.smsEnabled,
              },
            });
          } else {
            await this.prisma.notificationEventSetting.create({
              data: {
                event: ev.event,
                enabled: ev.enabled,
                bellEnabled: ev.bellEnabled,
                pushEnabled: ev.pushEnabled,
                emailEnabled: ev.emailEnabled,
                toastEnabled: ev.toastEnabled,
                socketEnabled: ev.socketEnabled,
                smsEnabled: ev.smsEnabled,
              },
            });
          }
        }
      }

      // Auditing
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;
      await this.notificationsService.logAdminAudit(
        user.id,
        'UPDATE_SETTINGS',
        'System',
        undefined,
        { updatedGlobal: !!global, updatedEvents: events?.length || 0 },
        ipAddress,
        userAgent,
      );

      return res.json({
        success: true,
        message: 'Settings updated successfully',
      });
    } catch (err: any) {
      console.error('Update settings error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Put('admin/settings/events/:id')
  @Roles('SUPER_ADMIN')
  async updateEventSetting(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;

      const existing = await this.prisma.notificationEventSetting.findUnique({
        where: { id },
      });
      if (!existing) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Event setting not found' });
      }

      const updated = await this.prisma.notificationEventSetting.update({
        where: { id },
        data: {
          enabled: body.enabled !== undefined ? body.enabled : existing.enabled,
          bellEnabled:
            body.bellEnabled !== undefined
              ? body.bellEnabled
              : existing.bellEnabled,
          pushEnabled:
            body.pushEnabled !== undefined
              ? body.pushEnabled
              : existing.pushEnabled,
          emailEnabled:
            body.emailEnabled !== undefined
              ? body.emailEnabled
              : existing.emailEnabled,
          toastEnabled:
            body.toastEnabled !== undefined
              ? body.toastEnabled
              : existing.toastEnabled,
          socketEnabled:
            body.socketEnabled !== undefined
              ? body.socketEnabled
              : existing.socketEnabled,
          smsEnabled:
            body.smsEnabled !== undefined
              ? body.smsEnabled
              : existing.smsEnabled,
        },
      });

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;
      await this.notificationsService.logAdminAudit(
        user.id,
        'UPDATE_EVENT_SETTING',
        'EventSetting',
        id,
        body,
        ipAddress,
        userAgent,
      );

      return res.json({ success: true, event: updated });
    } catch (err: any) {
      console.error('Update event setting error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/templates')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getTemplates(@Res() res: Response) {
    try {
      const templates = await this.prisma.notificationTemplate.findMany();
      return res.json({ templates });
    } catch (err: any) {
      console.error('Fetch templates error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Post('admin/templates')
  @Roles('SUPER_ADMIN')
  async updateTemplates(
    @Body() body: { templates: any[] },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const { templates } = body;
      if (templates && Array.isArray(templates)) {
        for (const temp of templates) {
          const existing = await this.prisma.notificationTemplate.findFirst({
            where: {
              event: temp.event,
              channel: temp.channel,
              version: temp.version || 1,
            },
          });

          if (existing) {
            await this.prisma.notificationTemplate.update({
              where: { id: existing.id },
              data: {
                title: temp.title,
                body: temp.body,
              },
            });
          } else {
            await this.prisma.notificationTemplate.create({
              data: {
                event: temp.event,
                channel: temp.channel,
                version: temp.version || 1,
                title: temp.title,
                body: temp.body,
              },
            });
          }
        }
      }

      // Auditing
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
      const userAgent = req.headers['user-agent'] as string;
      await this.notificationsService.logAdminAudit(
        user.id,
        'UPDATE_TEMPLATES',
        'Template',
        undefined,
        body,
        ipAddress,
        userAgent,
      );

      return res.json({
        success: true,
        message: 'Templates saved successfully',
      });
    } catch (err: any) {
      console.error('Update templates error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/audits')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getAudits(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') pageRaw = '1',
    @Query('limit') limitRaw = '20',
    @Query('action') action?: string,
    @Query('adminId') adminId?: string,
  ) {
    try {
      const page = Math.max(1, parseInt(pageRaw, 10));
      const limit = Math.max(1, Math.min(100, parseInt(limitRaw, 10)));
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      if (action) whereClause.action = action;
      if (adminId) whereClause.adminId = adminId;

      const [audits, total] = await Promise.all([
        this.prisma.notificationAdminAudit.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            admin: {
              select: { name: true, email: true },
            },
          },
        }),
        this.prisma.notificationAdminAudit.count({
          where: whereClause,
        }),
      ]);

      return res.json({
        audits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err: any) {
      console.error('Fetch audits error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Get('admin/audits/:id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'VIEWER')
  async getAuditDetails(@Param('id') id: string, @Res() res: Response) {
    try {
      const audit = await this.prisma.notificationAdminAudit.findUnique({
        where: { id },
        include: {
          admin: {
            select: { name: true, email: true },
          },
        },
      });

      if (!audit) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Audit log not found' });
      }

      return res.json({ audit });
    } catch (err: any) {
      console.error('Fetch audit details error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }
}
