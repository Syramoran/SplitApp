import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { GroupMember } from '../../groups/entities/group-member.entity';
import { Expense } from './expense.entity';

/**
 * Parte de un gasto grupal que le corresponde a cada miembro.
 * Estas filas son las que hacen explicable todo balance
 * (principio de diseño 2: transparencia radical).
 */
@Entity('expense_splits')
@Unique(['expenseId', 'memberId'])
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'expense_id', type: 'uuid' })
  expenseId: string;

  @ManyToOne(() => Expense, (expense) => expense.splits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expense_id' })
  expense: Expense;

  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => GroupMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: GroupMember;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  amount: number;

  /** Peso usado para calcular la parte: cantidad de partes o porcentaje. */
  @Column({ type: 'numeric', precision: 9, scale: 2, nullable: true, transformer: numericTransformer })
  weight: number | null;
}
