import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';

import { Users } from 'src/users/models/users.entity';

@Entity()
export class Photos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @OneToOne(() => Users, (user) => user.photo)
  user: Users;
}
