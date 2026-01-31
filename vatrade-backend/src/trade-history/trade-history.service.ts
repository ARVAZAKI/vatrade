import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradeHistory } from './trade-history.entity';
import { CreateTradeHistoryDto } from './dto/create-trade-history.dto';
import { UpdateTradeHistoryDto } from './dto/update-trade-history.dto';

@Injectable()
export class TradeHistoryService {
  constructor(
    @InjectRepository(TradeHistory)
    private tradeHistoryRepository: Repository<TradeHistory>,
  ) {}

  async create(userId: string, createTradeHistoryDto: CreateTradeHistoryDto): Promise<TradeHistory> {
    const tradeHistory = this.tradeHistoryRepository.create({
      ...createTradeHistoryDto,
      userId,
    });
    return this.tradeHistoryRepository.save(tradeHistory);
  }

  async findAll(userId: string): Promise<TradeHistory[]> {
    return this.tradeHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<TradeHistory> {
    const tradeHistory = await this.tradeHistoryRepository.findOne({
      where: { id, userId },
    });

    if (!tradeHistory) {
      throw new NotFoundException(`Trade history with ID ${id} not found`);
    }

    return tradeHistory;
  }

  async update(userId: string, id: string, updateTradeHistoryDto: UpdateTradeHistoryDto): Promise<TradeHistory> {
    const tradeHistory = await this.findOne(userId, id);
    Object.assign(tradeHistory, updateTradeHistoryDto);
    return this.tradeHistoryRepository.save(tradeHistory);
  }

  async remove(userId: string, id: string): Promise<void> {
    const tradeHistory = await this.findOne(userId, id);
    await this.tradeHistoryRepository.remove(tradeHistory);
  }

  async findBySymbol(userId: string, symbol: string): Promise<TradeHistory[]> {
    return this.tradeHistoryRepository.find({
      where: { userId, symbol },
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(userId: string): Promise<any> {
    const trades = await this.findAll(userId);
    
    const totalBuys = trades.filter(t => t.action === 'buy').length;
    const totalSells = trades.filter(t => t.action === 'sell').length;
    const totalAllocation = trades.reduce((sum, t) => sum + Number(t.allocationAmount), 0);
    
    return {
      totalTrades: trades.length,
      totalBuys,
      totalSells,
      totalAllocation,
    };
  }
}
