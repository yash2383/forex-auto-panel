import { Module } from '@nestjs/common';
import { TradeController } from './trade.controller';
import { TradesController } from './trades.controller';
import { TradeService } from './trade.service';
import { TradeEngineService } from './trade-engine.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TradeController, TradesController],
  providers: [TradeService, TradeEngineService],
})
export class TradeModule {}
