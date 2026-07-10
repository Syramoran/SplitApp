import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { Group } from '../../groups/entities/group.entity';
import { GoalContribution } from './goal-contribution.entity';

/**
 * Meta de ahorro. groupId opcional = meta compartida con un grupo
 * ("Mendoza · con Nico 60/40"). Registramos, no guardamos:
 * la plata vive donde el usuario elija.
 */
@Entity('savings_goals')
export class SavingsGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId: string | null;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Group | null;

  @Column()
  name: string;

  @Column({ default: 'plane' })
  icon: string;

  @Column({ name: 'target_amount', type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  targetAmount: number;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate: string | null;

  @OneToMany(() => GoalContribution, (c) => c.goal)
  contributions: GoalContribution[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
