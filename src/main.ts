import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { DingTalkModule } from './modules/dingtalk';
import { EthModule } from './modules/eth';

@Module({
  imports: [DingTalkModule, EthModule],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(80);
}

bootstrap();
