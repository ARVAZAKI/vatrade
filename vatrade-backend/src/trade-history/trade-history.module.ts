import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeHistoryController } from './trade-history.controller';
import { TradeHistoryService } from './trade-history.service';
import { TradeHistory } from './trade-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TradeHistory])],
  controllers: [TradeHistoryController],
  providers: [TradeHistoryService],
  exports: [TradeHistoryService],
})
export class TradeHistoryModule {}
