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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCoinDto } from './dto/create-coin.dto';
import { UpdateCoinDto } from './dto/update-coin.dto';

@Controller('coins')
@UseGuards(JwtAuthGuard)
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  create(@Request() req, @Body() createCoinDto: CreateCoinDto) {
    return this.strategiesService.create(req.user.sub, createCoinDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.strategiesService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.strategiesService.findOne(req.user.sub, id);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateCoinDto: UpdateCoinDto) {
    return this.strategiesService.update(req.user.sub, id, updateCoinDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id') id: string) {
    return this.strategiesService.remove(req.user.sub, id);
  }
}
