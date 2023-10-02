import { Injectable, Inject, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { DateTime } from 'luxon';

import {
  SignUpInterface,
  SignInInterface,
  AuthGenerateTokens,
  AuthAddRefreshToken,
} from './interfaces/auth.interface';

import { UsersService } from 'src/users/users.service';

import { Users } from 'src/users/models/users.entity';
import { RefreshTokens } from './models/refresh_tokens.entity';

import { hashPassword, checkPassword } from 'src/utils/bcrypt/bcrypt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    @Inject('REFRESH_TOKENS_REPOSITORY')
    private tokenRepository: Repository<RefreshTokens>,
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register User
   * @param data.firstName string
   * @param data.lastName string
   * @param data.email string
   * @param data.password string
   * @returns HttpException
   */
  async signUp(data: SignUpInterface): Promise<HttpException> {
    const checkExist = await this.usersService.checkExistUser(data.email);
    if (!checkExist) {
      // Hash Password
      const hashedPassword = await hashPassword(data.password);
      // Create Model
      const user = await this.usersService.create({
        email: data.email,
        hashed_password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      if (user) {
        throw new HttpException('User successfully registered.', 201);
      } else {
        throw new HttpException(
          'An error occurred while creating the user',
          500,
        );
      }
    } else {
      throw new HttpException('User with this email already exists', 409);
    }
  }

  /**
   * Login User
   * @param data.email string
   * @param data.password string
   * @returns 
   */
  async signIn(data: SignInInterface) {
    const user = await this.usersService.findOne(data.email);
    if (user) {
      const checkRes = await checkPassword(data.password, user.password);
      if (!checkRes) {
        throw new HttpException('Wrong email or password', 401);
      } else {
        const { access_token, refresh_token } = await this.generateTokens(user);
        if (access_token.length === 0 || refresh_token.length === 0) {
          throw new HttpException('Error in generateTokens', 500);
        }
        return {
          statusCode: 200,
          access_token,
          refresh_token,
        };
      }
    } else {
      throw new HttpException('User with this email does not exist', 404);
    }
  }

  /**
   * Generate Token JWT
   * @param user Users
   * @returns AuthGenerateTokens
   */
  async generateTokens(user: Users): Promise<AuthGenerateTokens> {
    const payload = { sub: user.id };
    const accessToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: '24h',
    });
    const refreshToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: '24h',
    });

    // Add Refresh Token To Database
    const resAddRefreshToken = await this.addRefreshToken({
      user: user,
      refreshToken: refreshToken,
      expiresAt: DateTime.now().plus({ days: 7 }).toISO(),
    });
    if (!resAddRefreshToken) {
      throw new HttpException('Error in addRefreshToken', 500);
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Add Jwt Token
   * @param data.user Users
   * @param data.refreshToken string
   * @param data.expiresAt string | null
   * @returns boolean
   */
  async addRefreshToken(data: AuthAddRefreshToken): Promise<boolean> {
    const refresh_token = await this.tokenRepository
      .createQueryBuilder()
      .insert()
      .into(RefreshTokens)
      .values({
        user: data.user,
        token: data.refreshToken,
        expires_at: data.expiresAt,
      })
      .execute();
    if (refresh_token) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get User From JWT Token
   * @param token string
   * @returns Users | null
   */
  async getUserFromAuthenticationToken(token: string): Promise<Users | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      const userID = payload.sub;
      if (userID) {
        return this.usersService.findByID(userID);
      }
    } catch {
      return;
    }
  }
}
