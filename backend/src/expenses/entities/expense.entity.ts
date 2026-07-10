import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { GroupMember } from '../../groups/entities/group-member.entity';
import { Group, SplitType } from '../../groups/entities/group.entity';
import { Category } from './category.entity';
import { ExpenseSplit } from './expense-split.entity';

/**
 * Gasto unificado: groupId NULL = gasto personal.
 * Mismo flujo para ambos mundos (principio de diseño 5).
 */
@Entity('expenses')
@Index(['groupId', 'date'])
@Index(['createdBy', 'date'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 140 })
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ type: 'char', length: 3, default: 'ARS' })
  currency: string;

  @Column({ name: 'category_id', type: 'smallint', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId: string | null;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group | null;

  /** Miembro del grupo que pagó. NULL en gastos personales. */
  @Column({ name: 'paid_by', type: 'uuid', nullable: true })
  paidBy: string | null;

  @ManyToOne(() => GroupMember, { nullable: true })
  @JoinColumn({ name: 'paid_by' })
  paidByMember: GroupMember | null;

  /** Usuario dueño del registro (quien lo cargó). */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'split_type', type: 'varchar', length: 10, nullable: true })
  splitType: SplitType | null;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ type: 'date' })
  date: string;

  @OneToMany(() => ExpenseSplit, (split) => split.expense, { cascade: ['insert'] })
  splits: ExpenseSplit[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
