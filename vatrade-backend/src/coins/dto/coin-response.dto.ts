import { ApiProperty } from '@nestjs/swagger';

export class CoinResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'BTCUSDT' })
  symbol: string;

  @ApiProperty({ example: '2024-01-30T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-30T10:00:00.000Z' })
  updatedAt: Date;
}
