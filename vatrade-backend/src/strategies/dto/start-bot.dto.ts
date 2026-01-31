import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class StartBotDto {
  @IsNotEmpty()
  @IsString()
  coinId: string;

  @IsNotEmpty()
  @IsString()
  credentialId: string;

  @IsOptional()
  @IsString()
  strategy?: string;
}
