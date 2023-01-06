// 在最前面初始化环境变量
// eslint-disable-next-line
require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DingTalkModule } from './modules/dingtalk';
import { EthModule } from './modules/ethereum';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: 'blockchain',
      charset: 'utf8mb4',
      entities: [EthereumBlocks, EthereumTransactions],
    }),
    ScheduleModule.forRoot(),
    DingTalkModule,
    EthModule,
  ],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(80);
}

bootstrap();
