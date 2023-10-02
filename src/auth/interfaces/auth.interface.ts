import { Users } from "src/users/models/users.entity";

export interface SignUpInterface {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInInterface {
  email: string;
  password: string;
}

export interface AuthGenerateTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthAddRefreshToken {
  user: Users;
  refreshToken: string;
  expiresAt: string | null;
}
