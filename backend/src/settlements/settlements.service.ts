import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GroupMember } from '../groups/entities/group-member.entity';
import { BalanceService } from './balance.service';
import { Settlement } from './entities/settlement.entity';
import { CreateSettlementDto } from './dto/create-settlement.dto';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement) private readonly settlementsRepo: Repository<Settlement>,
    @InjectRepository(GroupMember) private readonly membersRepo: Repository<GroupMember>,
    private readonly balanceService: BalanceService,
  ) {}

  async create(userId: string, dto: CreateSettlementDto): Promise<Settlement> {
    await this.balanceService.assertMembership(dto.groupId, userId);

    if (dto.fromMemberId === dto.toMemberId) {
      throw new BadRequestException('El pago debe ser entre dos personas distintas');
    }
    const members = await this.membersRepo.findBy({
      groupId: dto.groupId,
      id: In([dto.fromMemberId, dto.toMemberId]),
    });
    if (members.length !== 2) {
      throw new BadRequestException('Ambas personas deben ser parte del grupo');
    }

    return this.settlementsRepo.save(
      this.settlementsRepo.create({
        groupId: dto.groupId,
        fromMemberId: dto.fromMemberId,
        toMemberId: dto.toMemberId,
        amount: dto.amount,
        method: dto.method ?? 'transfer',
      }),
    );
  }
}
