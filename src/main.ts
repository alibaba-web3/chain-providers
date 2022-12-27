import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { DingTalkModule } from './dingtalk';
import { EthModule } from './eth';

@Module({
  imports: [DingTalkModule, EthModule],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(80);
}

bootstrap();
