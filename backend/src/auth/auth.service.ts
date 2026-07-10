import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

export interface AuthResponse {
  accessToken: string;
  user: { id: string; name: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersRepo.findOneBy({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }
    const user = await this.usersRepo.save(
      this.usersRepo.create({
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        name: dto.name,
        useCase: dto.useCase ?? null,
      }),
    );
    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepo.findOneBy({ email: dto.email.toLowerCase() });
    const valid = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!valid) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    return this.buildResponse(user);
  }

  private buildResponse(user: User): AuthResponse {
    return {
      accessToken: this.jwtService.sign({ sub: user.id, email: user.email }),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
