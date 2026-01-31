import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';
import { StrategyCoin } from './strategy-coin.entity';
import { UserCredentialsModule } from '../user-credentials/user-credentials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StrategyCoin]),
    UserCredentialsModule,
  ],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService],
})
export class StrategiesModule {}
