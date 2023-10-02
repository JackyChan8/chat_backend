import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateDialogDto {
    @ApiProperty()
    @IsNumber()
    partnerId: number;
}

export class CreateMessageDto {
    authorId: number;
    dialogId: number;
    text: string;
}

export class MessagesReadDto {
    userId: number;
    dialogId: number;
}

export class CreateDialogSocketDto {
    authorId: number;
    partnerId: number;
}