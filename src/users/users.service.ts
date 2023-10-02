import { Injectable, Inject } from '@nestjs/common';
import { Not, Repository } from 'typeorm';

import { Users } from './models/users.entity';
import { Photos } from './modules/photo/models/photo.entity';

import { CreateInterface } from './interfaces/users.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_REPOSITORY')
    private readonly usersRepository: Repository<Users>,
  ) {}

  /**
   * Check User Exist
   * @param email string
   * @returns boolean
   */
  async checkExistUser(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOneBy({
      email: email,
    });
    if (user) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Create User
   * @param data.firstName string
   * @param data.lastName string
   * @param data.email string
   * @param data.hashed_password string
   * @returns boolean
   */
  async create(data: CreateInterface): Promise<boolean> {
    const user = await this.usersRepository
      .createQueryBuilder()
      .insert()
      .into(Users)
      .values({
        email: data.email,
        password: data.hashed_password,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      .execute();
    if (user) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Find One User By Email
   * @param email string
   * @returns Users | null
   */
  async findOne(email: string): Promise<Users | null> {
    return this.usersRepository.findOneBy({
      email: email,
    });
  }

  /**
   * Find User By Id
   * @param userId number
   * @returns Users | null
   */
  async findByID(userId: number): Promise<Users | null> {
    return this.usersRepository.findOne({
      relations: ['photo'],
      where: {
        id: userId,
      },
    });
  }

  /**
   * Update Photo by UserId
   * @param userId number
   * @param photo Photos
   * @returns boolean
   */
  async updatePhoto(userId: number, photo: Photos): Promise<boolean> {
    const isUpdate = (
      await this.usersRepository.update(
        { id: userId },
        {
          photo: photo,
        },
      )
    ).affected;
    if (isUpdate) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * 
   * @param userId number
   * @param ids Array<number>
   * @returns 
   */
  async findAll(userId: number, ids: Array<number>) {
    try {
      let users = [];
      if (ids.length > 0) {
        users = await this.usersRepository
        .createQueryBuilder('users')
        .leftJoinAndSelect('users.photo', 'photo')
        .select([
          "users.id",
          "users.firstName",
          "users.lastName",
          "users.photo",
          
          "photo.filename",
        ])
        .where("users.id NOT IN (:...usersIds)", { usersIds: [...ids] })
        .getMany();
      } else {
        users = await this.usersRepository.find({
          relations: ['photo'],
          where: { id: Not(userId) },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: { filename: true }
          }
        })
      }
      return {
        statusCode: 200,
        message: 'Success Received Users',
        data: users,
      };
    } catch (err) {
      return {
        statusCode: 500,
        message: 'An error occurred while get users'
      }
    }
  }

  /**
   * Get Profile by UserId
   * @param userId number
   * @returns Promise<Users>
   */
  async getProfile(userId: number) {
    return await this.usersRepository.findOne({
      relations: ['photo'],
      where: {
        id: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photo: {
          filename: true,
        },
      }
    })
  }
}
