import { ApiProperty } from '@nestjs/swagger';

export class CredentialResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-here' })
  userId: string;

  @ApiProperty({ example: 'your-binance-api-key' })
  apiKey: string;

  @ApiProperty({ example: '2026-01-29T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-29T10:00:00Z' })
  updatedAt: Date;
}
