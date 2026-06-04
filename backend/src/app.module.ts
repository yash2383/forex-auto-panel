import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TradeModule } from './trade/trade.module';
import { PlansModule } from './plans/plans.module';
import { AdminModule } from './admin/admin.module';
import { ReportsModule } from './reports/reports.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { InvestmentModule } from './investment/investment.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsModule } from './notifications/notifications.module';
import { ObservabilityModule } from './observability/observability.module';
import { DevModule } from './dev/dev.module';
import { MaintenanceGuard } from './common/guards/maintenance.guard';

const optionalModules = [];
if (process.env.NODE_ENV !== 'production') {
  optionalModules.push(DevModule);
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    DashboardModule,
    TradeModule,
    PlansModule,
    AdminModule,
    ReportsModule,
    UserModule,
    WalletModule,
    InvestmentModule,
    NotificationsModule,
    ObservabilityModule,
    ...optionalModules,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // MaintenanceGuard must run AFTER JwtAuthGuard so request.user is populated.
    // JwtAuthGuard is registered per-module; maintenance runs globally here.
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },
  ],
})
export class AppModule {}
