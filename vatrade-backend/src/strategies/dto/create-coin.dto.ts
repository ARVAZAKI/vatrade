import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateCoinDto {
  @IsString()
  symbol: string;

  @IsNumber()
  @Min(0)
  allocationAmount: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
