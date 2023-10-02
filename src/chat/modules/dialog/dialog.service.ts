import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Dialogs } from './models/dialog.entity';
import { UsersService } from 'src/users/users.service';

import { CreateDialogInterface } from './interfaces/dialog.interface';

@Injectable()
export class DialogService {
  constructor(
    @Inject('DIALOGS_REPOSITORY')
    private dialogRepository: Repository<Dialogs>,
    private usersService: UsersService,
  ) {}

  /**
   * Check Exist By User Id
   * @param authorId number
   * @param partnerId number
   * @returns boolean
   */
  async checkExistByUsersID(
    authorId: number,
    partnerId: number,
  ): Promise<boolean> {
    return await this.dialogRepository.exist({
      where: [
        { author: { id: authorId }, partner: { id: partnerId } },
        { author: { id: partnerId }, partner: { id: authorId } },
      ],
    });
  }

  /**
   * Check Exist User In Dialog
   * @param dialogId number
   * @param userId number
   * @returns boolean
   */
  async checkExistUserInDialog(dialogId: number, userId: number): Promise<boolean> {
    return await this.dialogRepository.exist({
      where: [
        { id: dialogId, author: { id: userId } },
        { id: dialogId, partner: { id: userId } },
      ],
    });
  }

  /**
   * Create Dialog
   * @param data.authorId number
   * @param data.partnerId number
   * @returns 
   */
  async create(data: CreateDialogInterface) {
    // Check Exist Dialog
    const isExist = await this.checkExistByUsersID(
      data.authorId,
      data.partnerId,
    );
    if (!isExist) {
      // Get Users
      const author = await this.usersService.findByID(data.authorId);
      const partner = await this.usersService.findByID(data.partnerId);
      if (author && partner) {
        // Message Send
        const message = `Привет ${partner.firstName}, увидел тебя здесь. Давай общаться.`;
        // Create Dialog
        const dialog = await this.dialogRepository
          .createQueryBuilder()
          .insert()
          .into(Dialogs)
          .values({
            author: author,
            partner: partner,
            lastMessage: message,
          })
          .execute();
        if (dialog) {
          // Create Message
          return {
            status: 201,
            message: 'Dialog created successfully',
            data: {
              authorId: data.authorId,
              dialogId: dialog.raw[0].id,
              text: message,
            },
          };
        } else {
          return {
            status: 500,
            message: 'An error occurred while creating the dialog',
          };
        }
      } else {
        return {
          status: 500,
          message: 'An error occurred while creating the dialog',
        };
      }
    } else {
      return { status: 409, message: 'Dialog already exists' };
    }
  }

  /**
   * Get All Dialogs
   * @param userId number
   * @returns Array<Dialogs>
   */
  async getAll(userId: number): Promise<Array<Dialogs>> {
    const dialogs = await this.dialogRepository
      .createQueryBuilder('dialogs')
      .leftJoinAndSelect('dialogs.author', 'author')
      .leftJoinAndSelect('dialogs.partner', 'partner')
      .leftJoinAndSelect('author.photo', 'photo.author')
      .leftJoinAndSelect('partner.photo', 'photo.partner')
      .leftJoinAndSelect('dialogs.messages', 'messages')
      .select([
        'dialogs.id',
        'dialogs.author',
        'dialogs.partner',
        'dialogs.lastMessage',

        'author.id',
        'author.firstName',
        'author.lastName',
        'photo.author.filename',

        'partner.id',
        'partner.firstName',
        'partner.lastName',
        'photo.partner.filename',
      ])
      .where('author.id = :userId', { userId: userId })
      .orWhere('partner.id = :userId', { userId: userId })
      .loadRelationCountAndMap(
        'dialogs.unreadCount',
        'dialogs.messages',
        'message',
        (qb) =>
          qb
            .where('message.author.id != :userId', { userId: userId })
            .andWhere('message.read = false'),
      )
      .getMany();

    return dialogs;
  }

  /**
   * Get Dialog
   * @param dialogID number
   * @returns Dialogs | null
   */
  async getDialog(dialogID: number): Promise<Dialogs | null> {
    return this.dialogRepository.findOne({
      relations: ['author', 'partner'],
      where: { id: dialogID }
    });
  }

  /**
   * Get Dialog Info
   * @param authorId number
   * @param partnerId number
   * @returns Dialogs | null
   */
  async getDialogInfo(authorId: number, partnerId: number): Promise<Dialogs | null> {
    const dialogs = await this.dialogRepository
    .createQueryBuilder('dialogs')
    .leftJoinAndSelect('dialogs.author', 'author')
    .leftJoinAndSelect('dialogs.partner', 'partner')
    .leftJoinAndSelect('author.photo', 'photo.author')
    .leftJoinAndSelect('partner.photo', 'photo.partner')
    .leftJoinAndSelect('dialogs.messages', 'messages')
    .select([
      'dialogs.id',
      'dialogs.author',
      'dialogs.partner',
      'dialogs.lastMessage',

      'author.id',
      'author.firstName',
      'author.lastName',
      'photo.author.filename',

      'partner.id',
      'partner.firstName',
      'partner.lastName',
      'photo.partner.filename',
    ])
    .where('author.id = :authorId AND partner.id = :partnerId', { authorId: authorId, partnerId: partnerId })
    .orWhere('partner.id = :authorId AND author.id = :partnerId', { authorId: authorId, partnerId: partnerId })
    .loadRelationCountAndMap(
      'dialogs.unreadCount',
      'dialogs.messages',
      'message',
      (qb) =>
        qb
          .where('message.author.id != :userId', { userId: partnerId })
          .andWhere('message.read = false'),
    )
    .getOne();

  return dialogs;
  }

  /**
   * Getting users with whom a dialog has not been created
   * @param userId number
   * @returns 
   */
  async getUsersNotCreateDialog(userId: number) {
    // Get Ids
    const dialogs = await this.dialogRepository
      .createQueryBuilder('dialogs')
      .leftJoinAndSelect('dialogs.author', 'author')
      .leftJoinAndSelect('dialogs.partner', 'partner')
      .select(['dialogs.id', 'author.id', 'partner.id'])
      .where('author.id = :userId', { userId: userId })
      .orWhere('partner.id = :userId', { userId: userId })
      .getMany();

    const ids = dialogs.flatMap((el) => [el.author.id, el.partner.id]);
    return await this.usersService.findAll(userId, ids);
  }

  /**
   * Get Partner in Dialog
   * @param dialogId number
   * @returns Dialogs
   */
  async getPartnerDialog(dialogId: number): Promise<Dialogs> {
    const dialog = await this.dialogRepository.findOne({
      relations: ['author', 'partner'],
      where: { id: dialogId },
      select: {
        author: { id: true },
        partner: { id: true },
      },
    })
    return dialog;
  }

  /**
   * Get Info about Partner in dialog
   * @param userId number
   * @param dialogId number
   * @returns 
   */
  async getPartnerInfo(userId: number, dialogId: number) {
    // Check User in Dialog
    const checkInDialog = await this.checkExistUserInDialog(
      dialogId,
      userId,
    );
    if (checkInDialog) {
      // Dialog Users ID
      const dialogInfo = await this.getPartnerDialog(dialogId);
      // Get User By ID
      const partnerId = dialogInfo.author.id === userId ? dialogInfo.partner.id : dialogInfo.author.id;
      const user = await this.usersService.findByID(partnerId);
      return {
        statusCode: 200,
        message: 'Partner Info received successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          photo: user.photo.filename,
        }
      }
    } else {
      return {
        statusCode: 401,
        message: 'Unauthorized',
      };
    }
  }

  /**
   * Update Last Message in Dialog
   * @param dialogID number
   * @param message string
   * @returns boolean
   */
  async updateLastMessage(dialogID: number, message: string): Promise<boolean> {
    const post = (
      await this.dialogRepository.update(
        { id: dialogID },
        { lastMessage: message },
      )
    ).affected;
    if (post === 1) {
      return true;
    } else {
      return false;
    }
  }
}
