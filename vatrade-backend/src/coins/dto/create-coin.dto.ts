import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCoinDto {
  @ApiProperty({ example: 'BTCUSDT', description: 'Coin symbol' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  symbol: string;
}
