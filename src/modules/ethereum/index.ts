import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

// controllers
import { EthereumJsonRpcController } from './controllers/json-rpc';

// services
import { EthereumSyncGethToMysqlService_blocks } from './services/sync-to-mysql/blocks';
import { EthereumSyncGethToMysqlService_transactions } from './services/sync-to-mysql/transactions';
import { EthereumSyncGethToMysqlService_logs } from './services/sync-to-mysql/logs';
import { EthereumSyncGethToMysqlService_traces } from './services/sync-to-mysql/traces';
import { EthereumGethService } from './services/geth';
import { EthereumERC20BasicInfoService } from './services/erc20/basic-info';

// entities
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumTraces } from '@/entities/ethereum-traces';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumERC20BalanceDay } from '@/entities/ethereum-erc20-balance-day';
import { EthereumERC20EventApproval } from '@/entities/ethereum-erc20-event-approval';
import { EthereumERC20EventTransfer } from '@/entities/ethereum-erc20-event-transfer';

@Module({
  controllers: [EthereumJsonRpcController],
  providers: [
    EthereumSyncGethToMysqlService_blocks,
    EthereumSyncGethToMysqlService_transactions,
    EthereumSyncGethToMysqlService_logs,
    EthereumSyncGethToMysqlService_traces,
    EthereumGethService,
    EthereumERC20BasicInfoService,
  ],
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      EthereumBlocks,
      EthereumTransactions,
      EthereumLogs,
      EthereumTraces,
      EthereumERC20,
      EthereumERC20BalanceDay,
      EthereumERC20EventApproval,
      EthereumERC20EventTransfer,
    ]),
  ],
  exports: [
    EthereumSyncGethToMysqlService_blocks,
    EthereumSyncGethToMysqlService_transactions,
    EthereumSyncGethToMysqlService_logs,
    EthereumSyncGethToMysqlService_traces,
    EthereumGethService,
  ],
})
export class EthereumModule {}
