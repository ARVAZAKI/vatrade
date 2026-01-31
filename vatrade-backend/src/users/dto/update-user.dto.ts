import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsPhoneNumber, IsIn } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+628123456789', description: 'User phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'newPassword123', description: 'New password (optional)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'free', description: 'User type (free/premium)' })
  @IsOptional()
  @IsIn(['free', 'premium'])
  type?: string;

  @ApiPropertyOptional({ example: 'user', description: 'User role (user/admin)' })
  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: string;
}
