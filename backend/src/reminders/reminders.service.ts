import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BalanceService } from '../settlements/balance.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { Reminder } from './entities/reminder.entity';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder) private readonly remindersRepo: Repository<Reminder>,
    private readonly balanceService: BalanceService,
  ) {}

  async create(userId: string, dto: CreateReminderDto): Promise<Reminder> {
    const myMember = await this.balanceService.assertMembership(dto.groupId, userId);
    const balance = await this.balanceService.getGroupBalance(dto.groupId);

    // Solo se puede recordar una deuda real hacia quien la reclama:
    // el monto es un snapshot del balance, no un número tipeado a mano
    const pair = balance.pairs.find(
      (p) => p.fromMemberId === dto.toMemberId && p.toMemberId === myMember.id,
    );
    if (!pair) {
      throw new BadRequestException('Esa persona no tiene saldos pendientes con vos');
    }

    return this.remindersRepo.save(
      this.remindersRepo.create({
        groupId: dto.groupId,
        toMemberId: dto.toMemberId,
        amount: pair.amount,
        sentBy: userId,
      }),
    );
  }

  async listForGroup(userId: string, groupId: string): Promise<Reminder[]> {
    await this.balanceService.assertMembership(groupId, userId);
    return this.remindersRepo.find({
      where: { groupId },
      relations: { toMember: true },
      order: { sentAt: 'DESC' },
      take: 20,
    });
  }
}
