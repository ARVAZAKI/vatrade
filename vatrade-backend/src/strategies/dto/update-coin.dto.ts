import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class UpdateCoinDto {
  @IsString()
  @IsOptional()
  symbol?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  allocationAmount?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
