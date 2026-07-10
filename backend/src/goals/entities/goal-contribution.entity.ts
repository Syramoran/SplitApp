import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { SavingsGoal } from './savings-goal.entity';

/**
 * Aporte a una meta. userId nullable: en metas compartidas un aporte
 * puede venir de un participante sin cuenta — queda identificado por label.
 */
@Entity('goal_contributions')
export class GoalContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @ManyToOne(() => SavingsGoal, (goal) => goal.contributions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: SavingsGoal;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  label: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ type: 'varchar', length: 140, nullable: true })
  note: string | null;

  @Column({ type: 'date' })
  date: string;
}
