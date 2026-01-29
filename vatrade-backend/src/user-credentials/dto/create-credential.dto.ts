import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCredentialDto {
  @ApiProperty({
    description: 'Binance API Key',
    example: 'your-binance-api-key',
  })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiProperty({
    description: 'Binance Secret Key',
    example: 'your-binance-secret-key',
  })
  @IsNotEmpty()
  @IsString()
  secretKey: string;
}
