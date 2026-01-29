import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserCredentialsService } from '../user-credentials/user-credentials.service';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  private readonly engineUrl: string;

  constructor(
    private configService: ConfigService,
    private userCredentialsService: UserCredentialsService,
  ) {
    // Engine URL dari environment variable atau default
    this.engineUrl = this.configService.get<string>('ENGINE_URL') || 'http://engine:8000';
  }

  /**
   * Get Binance account information for a user
   */
  async getAccountInfo(userId: string, credentialId: string) {
    try {
      this.logger.log(`Fetching Binance account info for user ${userId}`);

      // Get user credentials from database (with secretKey)
      const credential = await this.userCredentialsService.findById(credentialId, userId);

      if (!credential) {
        throw new HttpException('Credential not found', HttpStatus.NOT_FOUND);
      }

      // Call Python engine
      const response = await axios.post(`${this.engineUrl}/binance/account`, {
        user_id: userId,
        credential_id: credentialId,
        api_key: credential.apiKey,
        secret_key: credential.secretKey,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Binance account: ${error.message}`);
      
      if (error.response?.data) {
        throw new HttpException(
          error.response.data.detail || 'Failed to fetch account data',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      throw new HttpException(
        'Failed to communicate with trading engine',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get Binance account balance (simplified)
   */
  async getBalance(userId: string, credentialId: string) {
    try {
      this.logger.log(`Fetching Binance balance for user ${userId}`);

      const credential = await this.userCredentialsService.findById(credentialId, userId);

      if (!credential) {
        throw new HttpException('Credential not found', HttpStatus.NOT_FOUND);
      }

      const response = await axios.post(`${this.engineUrl}/binance/balance`, {
        user_id: userId,
        credential_id: credentialId,
        api_key: credential.apiKey,
        secret_key: credential.secretKey,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Binance balance: ${error.message}`);
      
      if (error.response?.data) {
        throw new HttpException(
          error.response.data.detail || 'Failed to fetch balance',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      throw new HttpException(
        'Failed to communicate with trading engine',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get ticker price for a symbol
   */
  async getTicker(userId: string, credentialId: string, symbol: string = 'BTCUSDT') {
    try {
      this.logger.log(`Fetching ticker ${symbol} for user ${userId}`);

      const credential = await this.userCredentialsService.findById(credentialId, userId.toString());

      if (!credential) {
        throw new HttpException('Credential not found', HttpStatus.NOT_FOUND);
      }

      const response = await axios.post(
        `${this.engineUrl}/binance/ticker?symbol=${symbol}`,
        {
          user_id: userId,
          credential_id: credentialId,
          api_key: credential.apiKey,
          secret_key: credential.secretKey,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch ticker: ${error.message}`);
      
      if (error.response?.data) {
        throw new HttpException(
          error.response.data.detail || 'Failed to fetch ticker',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      throw new HttpException(
        'Failed to communicate with trading engine',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
