import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserCredentialsService } from './user-credentials.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import { CredentialResponseDto } from './dto/credential-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('User Credentials')
@Controller('user-credentials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserCredentialsController {
  constructor(
    private readonly userCredentialsService: UserCredentialsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create user credentials (Binance API keys)' })
  @ApiResponse({
    status: 201,
    description: 'Credentials created successfully',
    type: CredentialResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'User already has credentials' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @Request() req,
    @Body() createCredentialDto: CreateCredentialDto,
  ): Promise<CredentialResponseDto> {
    return this.userCredentialsService.create(
      req.user.sub,
      createCredentialDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get user credentials' })
  @ApiResponse({
    status: 200,
    description: 'Credentials retrieved successfully',
    type: CredentialResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Credentials not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(@Request() req): Promise<CredentialResponseDto> {
    return this.userCredentialsService.findByUserId(req.user.sub);
  }

  @Put()
  @ApiOperation({ summary: 'Update user credentials' })
  @ApiResponse({
    status: 200,
    description: 'Credentials updated successfully',
    type: CredentialResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Credentials not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @Request() req,
    @Body() updateCredentialDto: UpdateCredentialDto,
  ): Promise<CredentialResponseDto> {
    return this.userCredentialsService.update(
      req.user.sub,
      updateCredentialDto,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user credentials' })
  @ApiResponse({
    status: 200,
    description: 'Credentials deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Credentials deleted successfully' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Credentials not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async delete(@Request() req) {
    return this.userCredentialsService.delete(req.user.sub);
  }
}
