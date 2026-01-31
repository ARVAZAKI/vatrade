import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoinsService } from './coins.service';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { CoinResponseDto } from './dto/coin-response.dto';

@ApiTags('coins')
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new coin (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Coin created successfully',
    type: CoinResponseDto,
  })
  @ApiConflictResponse({ description: 'Coin symbol already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(@Body() createCoinDto: CreateCoinDto): Promise<CoinResponseDto> {
    // TODO: Add admin role guard
    return this.coinsService.create(createCoinDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all coins (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of all coins',
    type: [CoinResponseDto],
  })
  async findAll(): Promise<CoinResponseDto[]> {
    return this.coinsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a coin by ID' })
  @ApiResponse({
    status: 200,
    description: 'Coin details',
    type: CoinResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Coin not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(@Param('id') id: string): Promise<CoinResponseDto> {
    return this.coinsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a coin (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Coin updated successfully',
    type: CoinResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Coin not found' })
  @ApiConflictResponse({ description: 'Coin symbol already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateCoinDto: UpdateCoinDto,
  ): Promise<CoinResponseDto> {
    // TODO: Add admin role guard
    return this.coinsService.update(id, updateCoinDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a coin (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Coin deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Coin not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    // TODO: Add admin role guard
    await this.coinsService.remove(id);
    return { message: 'Coin deleted successfully' };
  }
}
