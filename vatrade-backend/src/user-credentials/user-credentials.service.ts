import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCredential } from './user-credential.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';

@Injectable()
export class UserCredentialsService {
  constructor(
    @InjectRepository(UserCredential)
    private readonly credentialRepository: Repository<UserCredential>,
  ) {}

  async create(userId: string, createCredentialDto: CreateCredentialDto) {
    // Check if user already has credentials
    const existingCredential = await this.credentialRepository.findOne({
      where: { userId },
    });

    if (existingCredential) {
      throw new ConflictException('User already has credentials. Please update instead.');
    }

    const credential = this.credentialRepository.create({
      userId,
      ...createCredentialDto,
    });

    await this.credentialRepository.save(credential);

    // Return without secretKey for security
    const { secretKey, ...result } = credential;
    return result;
  }

  async findByUserId(userId: string) {
    const credential = await this.credentialRepository.findOne({
      where: { userId },
    });

    if (!credential) {
      throw new NotFoundException('Credentials not found');
    }

    // Return without secretKey for security
    const { secretKey, ...result } = credential;
    return result;
  }

  async update(userId: string, updateCredentialDto: UpdateCredentialDto) {
    const credential = await this.credentialRepository.findOne({
      where: { userId },
    });

    if (!credential) {
      throw new NotFoundException('Credentials not found');
    }

    Object.assign(credential, updateCredentialDto);
    await this.credentialRepository.save(credential);

    // Return without secretKey for security
    const { secretKey, ...result } = credential;
    return result;
  }

  async delete(userId: string) {
    const credential = await this.credentialRepository.findOne({
      where: { userId },
    });

    if (!credential) {
      throw new NotFoundException('Credentials not found');
    }

    await this.credentialRepository.remove(credential);
    return { message: 'Credentials deleted successfully' };
  }

  // Method for internal use (includes secretKey)
  async findByUserIdWithSecret(userId: string): Promise<UserCredential> {
    const credential = await this.credentialRepository.findOne({
      where: { userId },
    });

    if (!credential) {
      throw new NotFoundException('Credentials not found');
    }

    return credential;
  }

  // Find by credential ID (for Binance service)
  async findById(credentialId: string, userId: string): Promise<UserCredential> {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credentials not found');
    }

    return credential;
  }
}
