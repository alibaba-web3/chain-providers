import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DingTalkModule } from '@/modules/dingtalk';
import { EthereumModule } from '@/modules/ethereum';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumTraces } from '@/entities/ethereum-traces';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumERC20BalanceDay } from '@/entities/ethereum-erc20-balance-day';
import { EthereumERC20EventApproval } from '@/entities/ethereum-erc20-event-approval';
import { EthereumERC20EventTransfer } from '@/entities/ethereum-erc20-event-transfer';
import { isProd, isTest } from '@/constants';

function getEnvFilePath() {
  if (isProd) return '.env.production';
  if (isTest) return '.env.test';
  return '.env.development';
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFilePath(),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST'),
        username: configService.get('MYSQL_USERNAME'),
        password: configService.get('MYSQL_PASSWORD'),
        database: 'blockchain',
        charset: 'utf8mb4',
        entities: [
          EthereumBlocks,
          EthereumTransactions,
          EthereumLogs,
          EthereumTraces,
          EthereumERC20,
          EthereumERC20BalanceDay,
          EthereumERC20EventApproval,
          EthereumERC20EventTransfer,
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    DingTalkModule,
    EthereumModule,
  ],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(+process.env.PORT || 80);
}

bootstrap();
