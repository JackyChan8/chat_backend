import { HttpException, Injectable } from '@nestjs/common';

import { DialogService } from './modules/dialog/dialog.service';
import { MessageService } from './modules/message/message.service';

import { CreateDialogInterface } from './interfaces/chat.interface';

@Injectable()
export class ChatService {
  constructor(
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
  ) {}

  /**
   * Create Dialog
   * @param data.authorId number
   * @param data.partnerId number
   * @returns 
   */
  async createDialog(data: CreateDialogInterface) {
    // Create Dialog
    const resDialog = await this.dialogService.create(data);
    if (resDialog.status === 201 && resDialog.data) {
      // Create Message
      const resMessage = await this.messageService.create(resDialog.data);
      // !!! Check Created Message !!!
      if (resMessage.status !== 201) {
        throw new HttpException(
          'The dialog has been created, but the message has not been sent',
          200,
        );
      } else {
        return {
          statusCode: 201,
          message: 'Dialog successfully create',
        };
      }
    }
    throw new HttpException(resDialog.message, resDialog.status);
  }
}