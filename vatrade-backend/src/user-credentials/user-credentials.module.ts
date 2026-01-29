import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCredentialsController } from './user-credentials.controller';
import { UserCredentialsService } from './user-credentials.service';
import { UserCredential } from './user-credential.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserCredential])],
  controllers: [UserCredentialsController],
  providers: [UserCredentialsService],
  exports: [UserCredentialsService],
})
export class UserCredentialsModule {}
