import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCredentialDto {
  @ApiProperty({
    description: 'Binance API Key',
    example: 'your-binance-api-key',
    required: false,
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiProperty({
    description: 'Binance Secret Key',
    example: 'your-binance-secret-key',
    required: false,
  })
  @IsOptional()
  @IsString()
  secretKey?: string;
}
