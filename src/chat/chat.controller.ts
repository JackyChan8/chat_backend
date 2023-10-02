import {
  Controller,
  Request,
  Body,
  Post,
  UseGuards,
  Get,
  HttpCode,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from 'src/auth/auth.guard';

import { ChatService } from './chat.service';
import { DialogService } from './modules/dialog/dialog.service';

import { CreateDialogDto } from './dto/chat.dto';
import { MessageService } from './modules/message/message.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly dialogService: DialogService,
        private readonly messageService: MessageService,
    ) {}

    @UseGuards(AuthGuard)
    @ApiResponse({
      status: 200,
      description: 'Dialogs successfully received',
    })
    @ApiOperation({ summary: 'Get Chats' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Get('get/dialogs')
    async getDialogs(@Request() req: any) {
      const dialogs = await this.dialogService.getAll(req.user.sub);
      return {
        statusCode: 200,
        message: 'Dialogs successfully received',
        data: dialogs,
      }
    }

    @UseGuards(AuthGuard)
    @ApiResponse({
      status: 200,
      description: 'The dialog has been created, but the message has not been sent',
    })
    @ApiResponse({
      status: 201,
      description: 'Dialog successfully create',
    })
    @ApiOperation({ summary: 'Create Dialog' })
    @ApiBearerAuth('JWT-auth')
    @HttpCode(200)
    @Post('create')
    async createDialog(@Body() body: CreateDialogDto, @Request() req: any) {
      return await this.chatService.createDialog({
        authorId: req.user.sub,
        partnerId: body.partnerId,
      });
    }

    @UseGuards(AuthGuard)
    @ApiResponse({
      status: 200,
      description: 'Success Received Users',
    })
    @ApiResponse({
      status: 500,
      description: 'An error occurred while get users',
    })
    @ApiOperation({ summary: 'Get Users' })
    @ApiBearerAuth('JWT-auth')
    @Get('get/users')
    async getUsers(@Request() req: any) {
      return await this.dialogService.getUsersNotCreateDialog(req.user.sub);
    }

    @UseGuards(AuthGuard)
    @ApiResponse({
      status: 200,
      description: 'Messages received successfully',
    })
    @ApiResponse({
      status: 401,
      description: 'Unauthorized',
    })
    @ApiOperation({ summary: 'Get Messages By Dialog ID' })
    @ApiBearerAuth('JWT-auth')
    @Get('get/messages/:id')
    async getMessages(@Param('id') dialogId: number, @Request() req: any) {
      return await this.messageService.getAll(req.user.sub, dialogId);
    }

    @UseGuards(AuthGuard)
    @ApiResponse({
      status: 200,
      description: 'Partner Info received successfully',
    })
    @ApiResponse({
      status: 401,
      description: 'Unauthorized',
    })
    @ApiOperation({ summary: 'Get Partner By Dialog ID' })
    @ApiBearerAuth('JWT-auth')
    @Get('get/partner/:id')
    async getPartner(@Param('id') dialogId: number, @Request() req: any) {
      return await this.dialogService.getPartnerInfo(req.user.sub, dialogId);
    }
}