import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserCredentialsModule } from './user-credentials/user-credentials.module';
import { User } from './users/user.entity';
import { UserCredential } from './user-credentials/user-credential.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'vatrade'),
        entities: [User, UserCredential],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserCredentialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
