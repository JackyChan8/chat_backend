import {
  Controller,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  HttpException,
  Get,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from 'src/auth/auth.guard';
import { storage } from 'src/utils/storage/storage';
import { UploadSingleFile } from 'src/utils/decorators/uploadFiles';

import { UsersService } from './users.service';
import { PhotoService } from './modules/photo/photo.service';

@ApiTags('user')
@Controller('user')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly photoService: PhotoService,
  ) {}

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 201,
    description: 'Photo uploaded successfully',
  })
  @ApiResponse({
    status: 500,
    description:
      'An error occurred while add photo to database | An error occurred while add photo',
  })
  @ApiOperation({ summary: 'Upload Photo' })
  @ApiBearerAuth('JWT-auth')
  @Post('photo/upload')
  @ApiConsumes('multipart/form-data')
  @UploadSingleFile()
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFile(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|gif|webp)$/,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    // Get User
    const user = await this.userService.findByID(req.user.sub);
    if (user) {
      // Add Photo
      const photo = await this.photoService.create(user, file.filename);
      if (photo) {
        // Update Photo In User Model
        const updateUser = await this.userService.updatePhoto(user.id, photo)
        if (updateUser) {
          return {
            statusCode: 201,
            message: 'Photo uploaded successfully',
            photo: file.filename,
          };
        }
      } else {
        throw new HttpException(
          'An error occurred while add photo to database',
          500,
        );
      }
    } else {
      throw new HttpException('An error occurred while add photo', 500);
    }
  }

  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Success Received My Info',
  })
  @ApiOperation({ summary: 'Get User Info' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @Get('info')
  async getMyInfo(@Request() req: any) {
    const profile = await this.userService.getProfile(req.user.sub);
    return {
      statusCode: 200,
      message: 'Success Received My Info',
      data: profile,
    }
  }
}
