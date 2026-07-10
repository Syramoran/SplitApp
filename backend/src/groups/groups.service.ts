import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BalanceService } from '../settlements/balance.service';
import { User } from '../users/entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupMember } from './entities/group-member.entity';
import { Group } from './entities/group.entity';

/** Paleta pastel del prototipo, rotada entre miembros y grupos. */
const AVATAR_COLORS = ['lilac', 'butter', 'blue', 'mint', 'peach'];
const GROUP_COLORS: Record<string, string> = {
  convivencia: 'lilac',
  pareja: 'peach',
  viaje: 'blue',
  evento: 'butter',
};

export interface GroupWithBalance extends Group {
  myBalance: number;
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMember) private readonly membersRepo: Repository<GroupMember>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly balanceService: BalanceService,
  ) {}

  async create(userId: string, dto: CreateGroupDto): Promise<Group> {
    const user = await this.usersRepo.findOneByOrFail({ id: userId });

    // Pareja con división proporcional: el % del creador viene del slider,
    // el resto se reparte entre los demás miembros
    const isPareja = dto.type === 'pareja' && dto.myPercent != null;
    const othersCount = Math.max(dto.members.length, 1);
    const otherPercent = isPareja ? (100 - (dto.myPercent as number)) / othersCount : null;

    const group = this.groupsRepo.create({
      name: dto.name,
      type: dto.type,
      currency: dto.currency ?? 'ARS',
      defaultSplitType: dto.defaultSplitType ?? (isPareja ? 'percent' : 'equal'),
      color: GROUP_COLORS[dto.type] ?? 'lilac',
      createdBy: userId,
      members: [
        this.membersRepo.create({
          userId,
          displayName: user.name,
          avatarColor: user.avatarColor,
          splitPercent: isPareja ? dto.myPercent : null,
        }),
        ...dto.members.map((name, index) =>
          this.membersRepo.create({
            userId: null,
            displayName: name,
            avatarColor: AVATAR_COLORS[(index + 1) % AVATAR_COLORS.length],
            splitPercent: otherPercent,
          }),
        ),
      ],
    });

    return this.groupsRepo.save(group);
  }

  async findMine(userId: string): Promise<GroupWithBalance[]> {
    const memberships = await this.membersRepo.find({ where: { userId } });
    if (memberships.length === 0) return [];

    const groups = await this.groupsRepo.find({
      where: memberships.map((m) => ({ id: m.groupId })),
      relations: { members: true },
      order: { createdAt: 'ASC' },
    });

    return Promise.all(
      groups.map(async (group) => ({
        ...group,
        myBalance: await this.balanceService.getMyNet(group.id, userId),
      })),
    );
  }

  async findOne(userId: string, groupId: string): Promise<Group> {
    await this.balanceService.assertMembership(groupId, userId);
    const group = await this.groupsRepo.findOne({
      where: { id: groupId },
      relations: { members: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }

  async addMember(userId: string, groupId: string, dto: AddMemberDto): Promise<GroupMember> {
    await this.balanceService.assertMembership(groupId, userId);
    const count = await this.membersRepo.countBy({ groupId });
    return this.membersRepo.save(
      this.membersRepo.create({
        groupId,
        userId: null,
        displayName: dto.name,
        avatarColor: AVATAR_COLORS[count % AVATAR_COLORS.length],
      }),
    );
  }
}
