import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Photos } from './models/photo.entity';
import { Users } from 'src/users/models/users.entity';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTOS_REPOSITORY')
    private photosRepository: Repository<Photos>,
  ) {}

  /**
   * Create Photo
   * @param user Users
   * @param filename string
   * @returns Promise<Photos | null>
   */
  async create(user: Users, filename: string): Promise<Photos | null> {
    // Insert Photo to Database
    const photo = await this.photosRepository
      .createQueryBuilder()
      .insert()
      .into(Photos)
      .values({
        user: user,
        filename: filename,
      })
      .execute();
    if (photo) {
      return photo.raw[0];
    } else {
      return null;
    }
  }
}
