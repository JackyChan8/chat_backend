import { Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

import { AuthModule } from 'src/auth/auth.module';
import { DialogModule } from './modules/dialog/dialog.module';
import { MessageModule } from './modules/message/message.module';

@Module({
    exports: [],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway],
    imports: [DialogModule, MessageModule, AuthModule],
})
export class ChatModule {}