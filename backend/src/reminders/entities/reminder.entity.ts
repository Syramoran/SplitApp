import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { GroupMember } from '../../groups/entities/group-member.entity';
import { Group } from '../../groups/entities/group.entity';

/**
 * Recordatorio neutral enviado por la app ("el mensaje incómodo lo
 * ponemos nosotros"). Guarda un snapshot de la deuda al momento del envío.
 */
@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'to_member_id', type: 'uuid' })
  toMemberId: string;

  @ManyToOne(() => GroupMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_member_id' })
  toMember: GroupMember;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ name: 'sent_by', type: 'uuid' })
  sentBy: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
