import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthService } from './auth.service';

import { SignUpDto, SignInDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    status: 201,
    description: 'User successfully registered.',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: 500,
    description: 'An error occurred while creating the user',
  })
  @ApiOperation({ summary: 'User Registration' })
  @Post('sign-up')
  async signUp(@Body() body: SignUpDto): Promise<HttpException> {
    return this.authService.signUp(body);
  }

  @ApiResponse({
    status: 200,
    description: 'The user has successfully authenticated',
  })
  @ApiResponse({
    status: 401,
    description: 'Wrong email or password',
  })
  @ApiResponse({
    status: 404,
    description: 'User with this email does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Error in generateTokens',
  })
  @ApiOperation({ summary: 'User Authorization' })
  @Post('sign-in')
  @HttpCode(200)
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const resSignIn = await this.authService.signIn(body);
    response.cookie('refresh-token', resSignIn.refresh_token, {
      maxAge: 3600 * 24 * 7,
      path: '/',
      secure: false,
      httpOnly: true,
    });
    return {
      statusCode: resSignIn.statusCode,
      access_token: resSignIn.access_token,
    };
  }
}