import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { round2 } from '../common/numeric.transformer';
import { GroupMember } from '../groups/entities/group-member.entity';
import { ContributeDto } from './dto/contribute.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalContribution } from './entities/goal-contribution.entity';
import { SavingsGoal } from './entities/savings-goal.entity';

export interface GoalWithProgress extends SavingsGoal {
  saved: number;
  percent: number;
}

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(SavingsGoal) private readonly goalsRepo: Repository<SavingsGoal>,
    @InjectRepository(GoalContribution)
    private readonly contributionsRepo: Repository<GoalContribution>,
    @InjectRepository(GroupMember) private readonly membersRepo: Repository<GroupMember>,
  ) {}

  async findMine(userId: string): Promise<GoalWithProgress[]> {
    const memberships = await this.membersRepo.find({ where: { userId } });
    const groupIds = memberships.map((m) => m.groupId);

    const goals = await this.goalsRepo
      .createQueryBuilder('goal')
      .leftJoinAndSelect('goal.group', 'group')
      .where('goal.owner_id = :userId', { userId })
      .orWhere(groupIds.length > 0 ? 'goal.group_id IN (:...groupIds)' : '1 = 0', { groupIds })
      .orderBy('goal.createdAt', 'ASC')
      .getMany();

    return Promise.all(goals.map((goal) => this.withProgress(goal)));
  }

  async create(userId: string, dto: CreateGoalDto): Promise<GoalWithProgress> {
    if (dto.groupId) {
      const member = await this.membersRepo.findOneBy({ groupId: dto.groupId, userId });
      if (!member) throw new ForbiddenException('No sos parte de ese grupo');
    }
    const goal = await this.goalsRepo.save(
      this.goalsRepo.create({
        ownerId: userId,
        groupId: dto.groupId ?? null,
        name: dto.name,
        icon: dto.icon ?? 'plane',
        targetAmount: dto.targetAmount,
        targetDate: dto.targetDate ?? null,
      }),
    );
    return this.withProgress(goal);
  }

  async findOne(
    userId: string,
    goalId: string,
  ): Promise<GoalWithProgress & { contributions: GoalContribution[] }> {
    const goal = await this.goalsRepo.findOne({ where: { id: goalId }, relations: { group: true } });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    await this.assertAccess(userId, goal);

    const contributions = await this.contributionsRepo.find({
      where: { goalId },
      order: { date: 'DESC' },
    });
    const withProgress = await this.withProgress(goal);
    return { ...withProgress, contributions };
  }

  async contribute(userId: string, goalId: string, dto: ContributeDto): Promise<GoalContribution> {
    const goal = await this.goalsRepo.findOneBy({ id: goalId });
    if (!goal) throw new NotFoundException('Meta no encontrada');
    await this.assertAccess(userId, goal);

    return this.contributionsRepo.save(
      this.contributionsRepo.create({
        goalId,
        userId,
        label: dto.label ?? 'Aporte tuyo',
        amount: dto.amount,
        note: dto.note ?? null,
        date: dto.date ?? new Date().toISOString().slice(0, 10),
      }),
    );
  }

  private async assertAccess(userId: string, goal: SavingsGoal): Promise<void> {
    if (goal.ownerId === userId) return;
    if (goal.groupId) {
      const member = await this.membersRepo.findOneBy({ groupId: goal.groupId, userId });
      if (member) return;
    }
    throw new ForbiddenException('No tenés acceso a esta meta');
  }

  private async withProgress(goal: SavingsGoal): Promise<GoalWithProgress> {
    const { sum } = await this.contributionsRepo
      .createQueryBuilder('contribution')
      .select('COALESCE(SUM(contribution.amount), 0)', 'sum')
      .where('contribution.goal_id = :goalId', { goalId: goal.id })
      .getRawOne<{ sum: string }>() ?? { sum: '0' };

    const saved = round2(parseFloat(sum));
    return {
      ...goal,
      saved,
      percent: goal.targetAmount > 0 ? Math.min(100, Math.round((saved / goal.targetAmount) * 100)) : 0,
    };
  }
}
