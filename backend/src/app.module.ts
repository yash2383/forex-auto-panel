import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TradeModule } from './trade/trade.module';
import { PlansModule } from './plans/plans.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DashboardModule,
    TradeModule,
    PlansModule,
    AdminModule,
  ],
})
export class AppModule {}
