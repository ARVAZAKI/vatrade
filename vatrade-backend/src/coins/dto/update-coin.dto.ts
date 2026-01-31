import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCoinDto {
  @ApiPropertyOptional({ example: 'ETHUSDT', description: 'Coin symbol' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  symbol?: string;
}
