import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategyCoin } from './strategy-coin.entity';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';

@Injectable()
export class StrategiesService {
  constructor(
    @InjectRepository(StrategyCoin)
    private coinsRepository: Repository<StrategyCoin>,
  ) {}

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
    await this.coinsRepository.remove(coin);
  }
}
