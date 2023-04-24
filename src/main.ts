// 在最前面初始化环境变量
// eslint-disable-next-line
require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DingTalkModule } from '@/modules/dingtalk';
import { BitcoinModule, bitcoinEntities } from '@/modules/bitcoin';
import { EthereumModule, ethereumEntities } from '@/modules/ethereum';
import { NftModule } from '@/modules/nft';

console.log('process.env.NODE_ENV:', process.env.NODE_ENV);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: 'blockchain',
      charset: 'utf8mb4',
      entities: [...bitcoinEntities, ...ethereumEntities],
    }),
    ScheduleModule.forRoot(),
    DingTalkModule,
    BitcoinModule,
    EthereumModule,
    NftModule,
  ],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(+process.env.PORT || 80);
}

bootstrap();
