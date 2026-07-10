import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  useCase: string | null;
  currency: string;
  theme: string;
  remindersEnabled: boolean;
  avatarColor: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  async findMe(userId: string): Promise<PublicUser> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.toPublic(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    Object.assign(user, dto);
    return this.toPublic(await this.usersRepo.save(user));
  }

  private toPublic(user: User): PublicUser {
    const { passwordHash: _hash, createdAt: _createdAt, ...publicUser } = user;
    return publicUser;
  }
}
