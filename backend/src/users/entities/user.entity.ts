import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ name: 'use_case', type: 'varchar', length: 20, nullable: true })
  useCase: string | null;

  @Column({ type: 'char', length: 3, default: 'ARS' })
  currency: string;

  @Column({ default: 'light' })
  theme: string;

  @Column({ name: 'reminders_enabled', default: true })
  remindersEnabled: boolean;

  @Column({ name: 'avatar_color', default: 'lilac' })
  avatarColor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
