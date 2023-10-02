import { DataSource } from 'typeorm';
import { RefreshTokens } from './models/refresh_tokens.entity';

export const refreshTokenProviders = [
  {
    provide: 'REFRESH_TOKENS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(RefreshTokens),
    inject: ['DATA_SOURCE'],
  },
];
