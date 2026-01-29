import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BinanceController } from './binance.controller';
import { BinanceService } from './binance.service';
import { UserCredentialsModule } from '../user-credentials/user-credentials.module';

@Module({
  imports: [ConfigModule, UserCredentialsModule],
  controllers: [BinanceController],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class BinanceModule {}
