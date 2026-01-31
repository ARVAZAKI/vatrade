import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TradeHistoryService } from './trade-history.service';
import { CreateTradeHistoryDto } from './dto/create-trade-history.dto';
import { UpdateTradeHistoryDto } from './dto/update-trade-history.dto';

@Controller('trade-history')
@UseGuards(JwtAuthGuard)
export class TradeHistoryController {
  constructor(private readonly tradeHistoryService: TradeHistoryService) {}

  @Post()
  create(@Request() req, @Body() createTradeHistoryDto: CreateTradeHistoryDto) {
    return this.tradeHistoryService.create(req.user.userId, createTradeHistoryDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.tradeHistoryService.findAll(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.tradeHistoryService.getStats(req.user.userId);
  }

  @Get('symbol/:symbol')
  findBySymbol(@Request() req, @Param('symbol') symbol: string) {
    return this.tradeHistoryService.findBySymbol(req.user.userId, symbol);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.tradeHistoryService.findOne(req.user.userId, id);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTradeHistoryDto: UpdateTradeHistoryDto,
  ) {
    return this.tradeHistoryService.update(req.user.userId, id, updateTradeHistoryDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.tradeHistoryService.remove(req.user.userId, id);
  }
}
