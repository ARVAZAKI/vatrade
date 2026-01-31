import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategyCoin } from './strategy-coin.entity';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { StartBotDto } from './dto/start-bot.dto';
import { UserCredentialsService } from '../user-credentials/user-credentials.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Logger } from '@nestjs/common';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);
  private readonly engineUrl: string;
  private activeBots: Map<string, any> = new Map(); // coinId -> bot info

  constructor(
    @InjectRepository(StrategyCoin)
    private coinsRepository: Repository<StrategyCoin>,
    private userCredentialsService: UserCredentialsService,
    private configService: ConfigService,
  ) {
    this.engineUrl = this.configService.get<string>('ENGINE_URL') || 'http://localhost:8000';
  }

  async create(userId: string, createCoinDto: CreateCoinDto): Promise<StrategyCoin> {
    const coin = this.coinsRepository.create({
      ...createCoinDto,
      userId,
    });

    return this.coinsRepository.save(coin);
  }

  async findAll(userId: string): Promise<StrategyCoin[]> {
    return this.coinsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<StrategyCoin> {
    const coin = await this.coinsRepository.findOne({
      where: { id, userId },
    });

    if (!coin) {
      throw new NotFoundException('Coin not found');
    }

    return coin;
  }

  async update(userId: string, id: string, updateCoinDto: UpdateCoinDto): Promise<StrategyCoin> {
    const coin = await this.findOne(userId, id);

    Object.assign(coin, updateCoinDto);
    return this.coinsRepository.save(coin);
  }

  async remove(userId: string, id: string): Promise<void> {
    const coin = await this.findOne(userId, id);
    
    // Stop bot if running
    if (this.activeBots.has(id)) {
      await this.stopBot(userId, id);
    }
    
    await this.coinsRepository.remove(coin);
  }

  async startBot(userId: string, startBotDto: StartBotDto) {
    try {
      this.logger.log(`Starting bot for user ${userId}, coin ${startBotDto.coinId}`);

      // Get coin details
      const coin = await this.findOne(userId, startBotDto.coinId);
      
      if (!coin.isActive) {
        throw new HttpException('Coin is not active', HttpStatus.BAD_REQUEST);
      }

      // Check if bot already running
      if (this.activeBots.has(startBotDto.coinId)) {
        throw new HttpException('Bot is already running for this coin', HttpStatus.CONFLICT);
      }

      // Get user credentials
      const credential = await this.userCredentialsService.findById(
        startBotDto.credentialId,
        userId,
      );

      if (!credential) {
        throw new HttpException('Credential not found', HttpStatus.NOT_FOUND);
      }

      // Check user balance before starting bot
      try {
        const balanceResponse = await axios.post(`${this.engineUrl}/binance/ws/account`, {
          user_id: userId,
          credential_id: startBotDto.credentialId,
          api_key: credential.apiKey,
          secret_key: credential.secretKey,
        });

        this.logger.log(`Balance response from engine: ${JSON.stringify(balanceResponse.data)}`);

        if (balanceResponse.data?.success && balanceResponse.data?.data?.balances) {
          const balances = balanceResponse.data.data.balances;
          this.logger.log(`Balances object: ${JSON.stringify(balances)}`);
          
          const usdtBalance = balances.USDT?.total || balances.USDT?.free || 0;
          const allocationAmount = Number(coin.allocationAmount);

          this.logger.log(`Balance check: USDT=${usdtBalance}, Required=${allocationAmount}`);

          if (usdtBalance < allocationAmount) {
            throw new HttpException(
              `Insufficient USDT balance. Required: ${allocationAmount} USDT, Available: ${usdtBalance.toFixed(2)} USDT`,
              HttpStatus.BAD_REQUEST,
            );
          }
        } else {
          throw new HttpException('Failed to retrieve balance', HttpStatus.SERVICE_UNAVAILABLE);
        }
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        this.logger.error(`Balance check failed: ${error.message}`);
        throw new HttpException(
          'Failed to verify account balance',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Call Python engine to start bot
      const response = await axios.post(`${this.engineUrl}/bot/start`, {
        user_id: userId,
        credential_id: startBotDto.credentialId,
        api_key: credential.apiKey,
        secret_key: credential.secretKey,
        strategy: startBotDto.strategy || 'ema20_ema50_rsi',
        symbol: coin.symbol,
        trade_amount: coin.allocationAmount,
      });

      // Store bot info
      this.activeBots.set(startBotDto.coinId, {
        botId: response.data.data.bot_id,
        coinId: startBotDto.coinId,
        symbol: coin.symbol,
        userId,
        startedAt: new Date(),
      });

      this.logger.log(`Bot started successfully: ${response.data.data.bot_id}`);

      return {
        success: true,
        message: 'Bot started successfully',
        data: {
          botId: response.data.data.bot_id,
          symbol: coin.symbol,
          strategy: startBotDto.strategy || 'ema20_ema50_rsi',
          allocationAmount: coin.allocationAmount,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to start bot: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.response?.data) {
        throw new HttpException(
          error.response.data.detail || 'Failed to start bot',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Failed to communicate with trading engine',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async stopBot(userId: string, coinId: string) {
    try {
      this.logger.log(`Stopping bot for user ${userId}, coin ${coinId}`);

      const botInfo = this.activeBots.get(coinId);
      
      if (!botInfo) {
        throw new HttpException('No active bot found for this coin', HttpStatus.NOT_FOUND);
      }

      // Call Python engine to stop bot
      await axios.post(`${this.engineUrl}/bot/stop`, {
        user_id: userId,
        bot_id: botInfo.botId,
      });

      // Remove from active bots
      this.activeBots.delete(coinId);

      this.logger.log(`Bot stopped successfully: ${botInfo.botId}`);

      return {
        success: true,
        message: 'Bot stopped successfully',
        data: {
          botId: botInfo.botId,
          symbol: botInfo.symbol,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to stop bot: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.response?.data) {
        throw new HttpException(
          error.response.data.detail || 'Failed to stop bot',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Failed to communicate with trading engine',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getBotStatus(userId: string) {
    try {
      const userCoins = await this.findAll(userId);
      const activeCoins = Array.from(this.activeBots.values()).filter(
        (bot) => bot.userId === userId,
      );

      return {
        success: true,
        data: {
          totalCoins: userCoins.length,
          activeCoins: userCoins.filter((c) => c.isActive).length,
          runningBots: activeCoins.length,
          bots: activeCoins.map((bot) => ({
            coinId: bot.coinId,
            botId: bot.botId,
            symbol: bot.symbol,
            startedAt: bot.startedAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get bot status: ${error.message}`);
      throw new HttpException(
        'Failed to get bot status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
