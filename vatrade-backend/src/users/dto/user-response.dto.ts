import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: '+628123456789', description: 'User phone number', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'free', description: 'User subscription type' })
  type: string;

  @ApiProperty({ example: 'user', description: 'User role' })
  role: string;

  @ApiProperty({ example: '2026-02-28', description: 'Payment deadline date', nullable: true })
  paymentDeadline: Date | null;

  @ApiProperty({ example: '2026-01-29T10:00:00Z', description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-29T10:00:00Z', description: 'Last update date' })
  updatedAt: Date;
}
