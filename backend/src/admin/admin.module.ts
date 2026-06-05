import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [AuthModule, NotificationsModule, ObservabilityModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
