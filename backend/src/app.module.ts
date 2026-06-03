import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
