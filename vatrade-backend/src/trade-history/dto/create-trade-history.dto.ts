import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { TradeAction } from '../trade-history.entity';

export class CreateTradeHistoryDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsEnum(TradeAction)
  @IsNotEmpty()
  action: TradeAction;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  allocationAmount: number;
}
