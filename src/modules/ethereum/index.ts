import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EthereumJsonRpcController } from './controllers/json-rpc';
import { EthereumGethService } from './services/geth';
import { EthereumSyncGethToMysqlService_blocks } from './services/sync-to-mysql/blocks';
import { EthereumSyncGethToMysqlService_transactions } from './services/sync-to-mysql/transactions';
import { EthereumSyncGethToMysqlService_logs } from './services/sync-to-mysql/logs';
import { EthereumSyncGethToMysqlService_traces } from './services/sync-to-mysql/traces';
import { EthereumERC20Service_info } from './services/erc20/info';
import { EthereumERC20Service_event_transfer } from './services/erc20/event-transfer';
import { EthereumERC20Service_event_approval } from './services/erc20/event-approval';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
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
    EthereumGethService,
    EthereumSyncGethToMysqlService_blocks,
    EthereumSyncGethToMysqlService_transactions,
    EthereumSyncGethToMysqlService_logs,
    EthereumSyncGethToMysqlService_traces,
    EthereumERC20Service_info,
    EthereumERC20Service_event_transfer,
    EthereumERC20Service_event_approval,
    DingTalkSendService,
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
    EthereumGethService,
    EthereumSyncGethToMysqlService_blocks,
    EthereumSyncGethToMysqlService_transactions,
    EthereumSyncGethToMysqlService_logs,
    EthereumSyncGethToMysqlService_traces,
  ],
})
export class EthereumModule {}
