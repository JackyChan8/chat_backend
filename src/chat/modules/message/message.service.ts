import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Messages } from './models/message.entity';

import { UsersService } from 'src/users/users.service';
import { DialogService } from '../dialog/dialog.service';

import { CreateMessageInterface } from './interfaces/message.interface';

@Injectable()
export class MessageService {
  constructor(
    @Inject('MESSAGES_REPOSITORY')
    private messageRepository: Repository<Messages>,
    private dialogService: DialogService,
    private usersService: UsersService,
  ) {}

  /**
   * Create Message
   * @param data.authorId number
   * @param data.dialogId number
   * @param data.text string
   * @returns 
   */
  async create(data: CreateMessageInterface) {
    // Check Exist Dialog
    const dialog = await this.dialogService.getDialog(data.dialogId);
    const user = await this.usersService.findByID(data.authorId);
    if (dialog && user) {
      // Create Message
      const message = await this.messageRepository
        .createQueryBuilder()
        .insert()
        .into(Messages)
        .values({
          text: data.text,
          dialog: dialog,
          author: user,
        })
        .execute();
      if (message) {
        return {
          status: 201,
          message: 'Message created successfully',
          data: {
            dialog: {
              dialogId: data.dialogId,
              authorId: dialog.author.id,
              partnerId: dialog.partner.id,
            },
            message: {
              id: message.identifiers[0].id,
              text: data.text,
              created_at: message.raw[0].created_at,
              author: {
                id: data.authorId,
                firstName: user.firstName,
                lastName: user.lastName,
                photo: {
                  filename: user.photo.filename,
                }
              }
            }
          },
        };
      } else {
        return {
          status: 500,
          message: 'An error occurred while creating the message',
        };
      }
    } else {
      return {
        status: 500,
        message: 'An error occurred while creating the message',
      };
    }
  }

  /**
   * Get Message
   * @param dialogId number
   * @param messageId number
   * @returns Promise<Messages | Messages[]>
   */
  async getOne(
    dialogId: number,
    messageId: number,
  ): Promise<Messages | Messages[]> {
    const message = await this.messageRepository.find({
      where: { id: messageId, dialog: { id: dialogId } },
      relations: [
        'author',
        'author.photo',
        'dialog',
        'dialog.author',
        'dialog.partner',
      ],
      select: {
        id: true,
        text: true,
        read: true,
        created_at: true,
        author: {
          id: true,
        },
        dialog: {
          id: true,
          lastMessage: true,
          author: {
            id: true,
            firstName: true,
            lastName: true,
            photo: {
              filename: true,
            },
          },
          partner: {
            id: true,
            firstName: true,
            lastName: true,
            photo: {
              filename: true,
            },
          },
        },
      },
      order: {
        created_at: 'ASC',
        author: { photo: { id: 'ASC' } },
      },
    });
    if (message.length) {
      return message[0];
    } else {
      return message;
    }
  }

  /**
   * Get All Messages
   * @param userId number
   * @param dialogId number
   * @returns 
   */
  async getAll(userId: number, dialogId: number) {
    // Check User in Dialog
    const checkInDialog = await this.dialogService.checkExistUserInDialog(
      dialogId,
      userId,
    );
    if (checkInDialog) {
      // Get Messages
      const messages = await this.messageRepository.find({
        relations: ['author', 'author.photo'],
        where: {
          dialog: { id: dialogId },
        },
        select: {
          id: true,
          text: true,
          author: {
            id: true,
            firstName: true,
            lastName: true,
            photo: {
              filename: true,
            },
          },
          created_at: true,
        },
        order: {
          created_at: 'ASC',
        }
      });
      return {
        statusCode: 200,
        message: 'Messages received successfully',
        data: messages,
      };
    } else {
      return {
        statusCode: 401,
        message: 'Unauthorized',
      };
    }
  }

  /**
   * Change Read Status Message
   * @param dialogId number
   * @param userId number
   * @returns boolean
   */
  async changeReadStatus(dialogId: number, userId: number): Promise<boolean> {
    let partnerId: number;
    const dialog = await this.dialogService.getPartnerDialog(dialogId);
    if (dialog) {
      partnerId = dialog.author.id === userId ? dialog.partner.id : dialog.author.id;
    }
    const messages = (
      await this.messageRepository.update(
        { dialog: { id: dialogId }, author: { id: partnerId }},
        { read: true, }
      )
    ).affected
    if (messages) {
      return true;
    } else {
      return false;
    }
  }
}
