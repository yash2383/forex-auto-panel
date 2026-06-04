import { Controller, Get, Header } from '@nestjs/common';
import { ObservabilityService } from './observability.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller()
export class ObservabilityController {
  constructor(
    private readonly observabilityService: ObservabilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    try {
      const health = await this.notificationsService.getQueueHealth();
      
      this.observabilityService.setGauge(
        'redis_connected',
        {},
        health.redisConnected ? 1 : 0,
      );

      const queueNames = ['push', 'email', 'socket', 'sms', 'dlq'] as const;
      for (const qName of queueNames) {
        const queueMetrics = health[qName];
        if (queueMetrics) {
          this.observabilityService.setGauge(
            'notification_queue_depth',
            { queue: qName, type: 'waiting' },
            queueMetrics.waiting,
          );
          this.observabilityService.setGauge(
            'notification_queue_depth',
            { queue: qName, type: 'active' },
            queueMetrics.active,
          );
          this.observabilityService.setGauge(
            'notification_queue_depth',
            { queue: qName, type: 'failed' },
            queueMetrics.failed,
          );
        }
      }
    } catch (err) {
      this.observabilityService.setGauge('redis_connected', {}, 0);
    }

    return this.observabilityService.getMetricsAsString();
  }
}
