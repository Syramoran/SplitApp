import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupMember } from './group-member.entity';

export type GroupType = 'convivencia' | 'pareja' | 'viaje' | 'evento';
export type SplitType = 'equal' | 'shares' | 'percent' | 'exact';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 15 })
  type: GroupType;

  @Column({ type: 'char', length: 3, default: 'ARS' })
  currency: string;

  @Column({ name: 'default_split_type', type: 'varchar', length: 10, default: 'equal' })
  defaultSplitType: SplitType;

  @Column({ default: 'lilac' })
  color: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @OneToMany(() => GroupMember, (member) => member.group, { cascade: ['insert'] })
  members: GroupMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
