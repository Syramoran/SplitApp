import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn({ type: 'smallint' })
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ name: 'is_fixed', default: false })
  isFixed: boolean;
}
