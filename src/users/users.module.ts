import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';

import { UsersService } from './users.service';
import { usersProviders } from './users.providers';
import { UsersController } from './users.controller';
import { PhotoModule } from './modules/photo/photo.module';

@Module({
    exports: [UsersService],
    imports: [DatabaseModule, PhotoModule],
    providers: [...usersProviders, UsersService],
    controllers: [UsersController],
})
export class UsersModule {}