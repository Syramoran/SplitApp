import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { GroupMember } from '../../groups/entities/group-member.entity';
import { Group } from '../../groups/entities/group.entity';

export type SettlementMethod = 'transfer' | 'cash' | 'other';

/**
 * Pago de cierre registrado: "Fede → vos, $8.500, por transferencia".
 * El pago real ocurre afuera — acá solo queda registrado.
 */
@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'from_member_id', type: 'uuid' })
  fromMemberId: string;

  @ManyToOne(() => GroupMember)
  @JoinColumn({ name: 'from_member_id' })
  fromMember: GroupMember;

  @Column({ name: 'to_member_id', type: 'uuid' })
  toMemberId: string;

  @ManyToOne(() => GroupMember)
  @JoinColumn({ name: 'to_member_id' })
  toMember: GroupMember;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'transfer' })
  method: SettlementMethod;

  @CreateDateColumn({ name: 'confirmed_at' })
  confirmedAt: Date;
}
