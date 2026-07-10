import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { Group, SplitType } from '../../groups/entities/group.entity';

/**
 * Plantilla de gasto recurrente ("alquiler e internet se cargan solos").
 * Un cron mensual la materializa como Expense el día indicado.
 */
@Entity('recurring_expenses')
export class RecurringExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId: string | null;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ length: 140 })
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ name: 'category_id', type: 'smallint', nullable: true })
  categoryId: number | null;

  @Column({ name: 'paid_by', type: 'uuid', nullable: true })
  paidBy: string | null;

  @Column({ name: 'split_type', type: 'varchar', length: 10, default: 'equal' })
  splitType: SplitType;

  @Column({ name: 'day_of_month', type: 'smallint', default: 1 })
  dayOfMonth: number;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'last_run', type: 'date', nullable: true })
  lastRun: string | null;
}
