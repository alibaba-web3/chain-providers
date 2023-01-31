import { Module } from '@nestjs/common';
import { EthereumJsonRpcController } from './controllers/json-rpc';
import { EthereumSyncGethToMysqlService_blocks } from './services/sync-to-mysql/blocks';
import { EthereumSyncGethToMysqlService_transactions } from './services/sync-to-mysql/transactions';
import { EthereumSyncGethToMysqlService_logs } from './services/sync-to-mysql/logs';
import { EthereumSyncGethToMysqlService_traces } from './services/sync-to-mysql/traces';
import { EthereumGethService } from './services/geth';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumTraces } from '@/entities/ethereum-traces';

@Module({
  controllers: [EthereumJsonRpcController],
  providers: [
    EthereumSyncGethToMysqlService_blocks,
    EthereumSyncGethToMysqlService_transactions,
    EthereumSyncGethToMysqlService_logs,
    EthereumSyncGethToMysqlService_traces,
    EthereumGethService,
  ],
  imports: [HttpModule, TypeOrmModule.forFeature([EthereumBlocks, EthereumTransactions, EthereumLogs, EthereumTraces])],
  exports: [
    EthereumSyncGethToMysqlService_blocks,
    EthereumSyncGethToMysqlService_transactions,
    EthereumSyncGethToMysqlService_logs,
    EthereumSyncGethToMysqlService_traces,
    EthereumGethService,
  ],
})
export class EthereumModule {}
