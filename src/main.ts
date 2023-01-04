import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DingTalkModule } from './modules/dingtalk';
import { EthModule } from './modules/ethereum';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '',
      username: '',
      password: '',
      database: '',
      charset: '',
      entities: [EthereumBlocks, EthereumTransactions],
    }),
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
