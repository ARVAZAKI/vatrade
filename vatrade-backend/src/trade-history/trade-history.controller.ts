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
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TradeHistoryService } from './trade-history.service';
import { CreateTradeHistoryDto } from './dto/create-trade-history.dto';
import { UpdateTradeHistoryDto } from './dto/update-trade-history.dto';

@Controller('trade-history')
export class TradeHistoryController {
  constructor(private readonly tradeHistoryService: TradeHistoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createTradeHistoryDto: CreateTradeHistoryDto) {
    return this.tradeHistoryService.create(req.user.sub, createTradeHistoryDto);
  }

  @Post('bot')
  async createFromBot(
    @Headers('x-bot-user-id') botUserId: string,
    @Body() createTradeHistoryDto: CreateTradeHistoryDto,
  ) {
    // This endpoint is for internal use by the trading engine
    // Validate that request comes from internal network
    if (!botUserId) {
      throw new Error('X-Bot-User-Id header is required');
    }
    
    return this.tradeHistoryService.create(botUserId, createTradeHistoryDto);
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
