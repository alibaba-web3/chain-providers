import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { EthModule } from './eth';

@Module({
  imports: [EthModule],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(80);
}

bootstrap();
