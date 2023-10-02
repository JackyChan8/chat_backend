import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());

  // Static Files
  app.useStaticAssets(join(__dirname, '..', 'storage'), {
    prefix: '/storage',
  });

  // Swagger Docs
  const config = new DocumentBuilder()
    .setTitle('Backend Dating')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // CORS
  app.enableCors({
    origin: [
      'https://localhost:3000',
      'http://localhost:3000',
      'https://localhost',
      'http://localhost',
    ],
    methods: ['*'],
    credentials: true,
    allowedHeaders: ['*'],
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(8000);
}
bootstrap();
