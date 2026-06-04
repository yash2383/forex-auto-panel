import { Module } from '@nestjs/common';
import { ObservabilityService } from './observability.service';
import { ObservabilityController } from './observability.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ObservabilityController],
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
