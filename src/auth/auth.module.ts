import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from 'src/database/database.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { refreshTokenProviders } from './auth.providers';

import { jwtConstants } from './constants';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  exports: [AuthService],
  providers: [...refreshTokenProviders, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
