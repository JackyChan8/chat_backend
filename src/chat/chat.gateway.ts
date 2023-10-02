import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { AuthService } from 'src/auth/auth.service';
import { DialogService } from './modules/dialog/dialog.service';
import { MessageService } from './modules/message/message.service';

import { CreateDialogSocketDto, CreateMessageDto, MessagesReadDto } from './dto/chat.dto';

import { Users } from 'src/users/models/users.entity';

import { CLIENT_URI } from 'src/constants';

const users: Record<string, number> = {};

@WebSocketGateway({
  cors: {
    origin: CLIENT_URI,
  },
  serveClient: false,
  namespace: 'chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly authService: AuthService,
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
  ) {}
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('afterInit ChatGateway');

    // Middleware Check Token
    server.use(async (socket, next) => {
      console.log('Middleware');
      let user: Users;
      const token = socket.handshake.headers.authorization;
      // Проверка токена
      if (token) {
        user = await this.authService.getUserFromAuthenticationToken(token);
        if (user) {
          const socketId = socket.id;
          users[socketId] = user.id;
        } else {
          return next(new Error('Invalid credentials'));
        }
      }
      next();
    });
  }

  // подключение
  async handleConnection(socket: Socket) {
    console.log('handleConnection - ChatGateway');
    console.log(`Socket ${socket.id} connected.`);
  }

  // отключение
  async handleDisconnect(client: Socket) {
    console.log('handleDisconnect - ChatGateway');
    const socketId = client.id;
    delete users[socketId];

    client.broadcast.emit('log', `${socketId} disconnected`);
  }

  // создание сообщения
  @SubscribeMessage('message:post')
  async handleMessagePost(
    @MessageBody() payload: CreateMessageDto,
  ): Promise<void> {
    console.log('message:post', payload);
    // Проверка входит ли Пользователь в диалог
    const checkInDialog = await this.dialogService.checkExistUserInDialog(
      payload.dialogId,
      payload.authorId,
    );
    if (checkInDialog) {
      // Создаем сообщение
      const res = await this.messageService.create(payload);
      if (res.status === 201) {
        // Обновление последнего сообщения в диалоге
        await this.dialogService.updateLastMessage(
          payload.dialogId,
          payload.text,
        );
        // Отправка сообщения на клиент
        this.server.emit('server:new_message', res.data);
        // Уведомление
        const partnerId = res.data.dialog.authorId === payload.authorId
        ? res.data.dialog.partnerId
        : res.data.dialog.authorId;
        this.server.emit('server:new_message:notify', {
          userId: partnerId,
          text: 'Пришло сообщение',
        })
      } else {
        // Отправка сообщения об ошибке
        this.server.emit('message_error', {
          userId: payload.authorId,
          message: 'Произошла ошибка при создании сообщения',
        })
      }
    } else {
      // Отправка сообщения об ошибке
      this.server.emit('message_error', {
        userId: payload.authorId,
        message: 'Вас нет в диалоге',
      });
    }
  }

  // Сообщения прочитанные
  @SubscribeMessage('messages:read')
  async handleMessagesRead(
    @MessageBody()
    payload: MessagesReadDto,
  ) {
    console.log('handleMessagesRead - messages:read: ', payload);
    // Проверка входит ли Пользователь в диалог
    const checkInDialog = await this.dialogService.checkExistUserInDialog(
      payload.dialogId,
      payload.userId,
    );
    if (checkInDialog) {
      const res = await this.messageService.changeReadStatus(
        payload.dialogId,
        payload.userId
      );
      if (res) {
        this.server.emit('server:read_message', {
          dialogId: payload.dialogId,
          userId: payload.userId,
        });
      }
    } else {
      // Отправка сообщения об ошибке
      this.server.emit('message_error', {
        userId: payload.userId,
        message: 'Вас нет в диалоге',
      });
    }
  }

  // Уведомление о создании диалога
  @SubscribeMessage('dialog:create:notify')
  async handleCreateDialog(
    @MessageBody()
    payload: CreateDialogSocketDto,
  ) {
    // Get Dialog
    const dialog = await this.dialogService.getDialogInfo(
      payload.authorId,
      payload.partnerId
    );
    console.log('dialog: ', dialog);
    if (dialog) {
      this.server.emit('server:new_dialog:notify', {
        userId: payload.partnerId,
        dialog: dialog,
      });
    }
  }
}
