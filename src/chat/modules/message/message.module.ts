import { Module } from '@nestjs/common';

import { MessageService } from './message.service';
import { UsersModule } from 'src/users/users.module';
import { DialogModule } from '../dialog/dialog.module';
import { messageProviders } from './message.providers';

import { DatabaseModule } from 'src/database/database.module';

@Module({
  exports: [MessageService],
  imports: [DatabaseModule, DialogModule, UsersModule],
  controllers: [],
  providers: [...messageProviders, MessageService],
})
export class MessageModule {}
