import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coin } from './coin.entity';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { CoinResponseDto } from './dto/coin-response.dto';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(Coin)
    private coinsRepository: Repository<Coin>,
  ) {}

  async create(createCoinDto: CreateCoinDto): Promise<CoinResponseDto> {
    // Check if symbol already exists
    const existingCoin = await this.coinsRepository.findOne({
      where: { symbol: createCoinDto.symbol },
    });

    if (existingCoin) {
      throw new ConflictException('Coin symbol already exists');
    }

    const coin = this.coinsRepository.create(createCoinDto);
    const savedCoin = await this.coinsRepository.save(coin);

    return {
      id: savedCoin.id,
      symbol: savedCoin.symbol,
      createdAt: savedCoin.createdAt,
      updatedAt: savedCoin.updatedAt,
    };
  }

  async findAll(): Promise<CoinResponseDto[]> {
    const coins = await this.coinsRepository.find({
      order: { symbol: 'ASC' },
    });

    return coins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      createdAt: coin.createdAt,
      updatedAt: coin.updatedAt,
    }));
  }

  async findOne(id: string): Promise<CoinResponseDto> {
    const coin = await this.coinsRepository.findOne({ where: { id } });

    if (!coin) {
      throw new NotFoundException('Coin not found');
    }

    return {
      id: coin.id,
      symbol: coin.symbol,
      createdAt: coin.createdAt,
      updatedAt: coin.updatedAt,
    };
  }

  async update(id: string, updateCoinDto: UpdateCoinDto): Promise<CoinResponseDto> {
    const coin = await this.coinsRepository.findOne({ where: { id } });

    if (!coin) {
      throw new NotFoundException('Coin not found');
    }

    // Check if new symbol already exists
    if (updateCoinDto.symbol && updateCoinDto.symbol !== coin.symbol) {
      const existingCoin = await this.coinsRepository.findOne({
        where: { symbol: updateCoinDto.symbol },
      });

      if (existingCoin) {
        throw new ConflictException('Coin symbol already exists');
      }
    }

    Object.assign(coin, updateCoinDto);
    const updatedCoin = await this.coinsRepository.save(coin);

    return {
      id: updatedCoin.id,
      symbol: updatedCoin.symbol,
      createdAt: updatedCoin.createdAt,
      updatedAt: updatedCoin.updatedAt,
    };
  }

  async remove(id: string): Promise<void> {
    const coin = await this.coinsRepository.findOne({ where: { id } });

    if (!coin) {
      throw new NotFoundException('Coin not found');
    }

    await this.coinsRepository.remove(coin);
  }
}
