import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BinanceService } from './binance.service';

@ApiTags('binance')
@Controller('binance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BinanceController {
  constructor(private readonly binanceService: BinanceService) {}

  @Get('account')
  @ApiOperation({ summary: 'Get Binance account information' })
  @ApiResponse({ status: 200, description: 'Account data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getAccount(
    @Request() req,
    @Query('credentialId') credentialId: string,
  ) {
    const userId = req.user.sub;
    return this.binanceService.getAccountInfo(userId, credentialId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get Binance account balance (non-zero only)' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getBalance(
    @Request() req,
    @Query('credentialId') credentialId: string,
  ) {
    const userId = req.user.sub;
    return this.binanceService.getBalance(userId, credentialId);
  }

  @Get('ticker')
  @ApiOperation({ summary: 'Get current price for a symbol' })
  @ApiResponse({ status: 200, description: 'Ticker retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Credential not found' })
  async getTicker(
    @Request() req,
    @Query('credentialId') credentialId: string,
    @Query('symbol') symbol?: string,
  ) {
    const userId = req.user.sub;
    return this.binanceService.getTicker(userId, credentialId, symbol);
  }
}
