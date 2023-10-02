import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Length, IsNotEmpty, IsEmail } from 'class-validator';

import { Photos } from '../modules/photo/models/photo.entity';
import { RefreshTokens } from 'src/auth/models/refresh_tokens.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 200,
    unique: true,
  })
  @IsEmail({}, { message: 'Incorrect email' })
  @IsNotEmpty({ message: 'Email обязательный' })
  email: string;

  @Column({
    type: 'varchar',
    length: 200,
  })
  @Length(8, 200, {
    message: 'Пароль должен быть минимум 8 символов и максимум 200 символов',
  })
  @IsNotEmpty({ message: 'Пароль обязательный' })
  password: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  firstName: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  lastName: string;

  @OneToOne(() => RefreshTokens, (token) => token.user, { nullable: true })
  @JoinColumn()
  refresh_token: RefreshTokens;

  @OneToOne(() => Photos, (photo) => photo.user, { nullable: true })
  @JoinColumn()
  photo: Photos;

  @CreateDateColumn()
  created_at: Date;
}
