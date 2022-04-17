import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(process.env.SPOTIFY_CLIENT_ID_MERGER)
  console.log(process.env.FIREBASE_CREDENTIALS_MERGER)
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Spotify apps NestJS backend')
    .setDescription('The API for the Spotify apps')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true,
    }),
  );
  fs.writeFileSync('./openapi/openapi.json', JSON.stringify(document));
  await app.listen(3000);
}
bootstrap();
