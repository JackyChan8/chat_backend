import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Users } from 'src/users/models/users.entity';

@Entity()
export class RefreshTokens {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Users, (user) => user.refresh_token, { nullable: false })
  @JoinColumn()
  user: Users;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  token: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;
}