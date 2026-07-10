import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { numericTransformer } from '../../common/numeric.transformer';
import { Group } from './group.entity';

/**
 * Miembro de un grupo. userId NULL = participante "fantasma":
 * existe solo con un nombre, sin cuenta registrada (principio de diseño 4).
 */
@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'avatar_color' })
  avatarColor: string;

  @Column({
    name: 'split_percent',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  splitPercent: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
