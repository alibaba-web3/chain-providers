import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EthereumJsonRpcController } from './controllers/json-rpc';
import { EthereumGethService } from './services/geth';
import { EthereumGethSyncService_blocks } from './services/geth/sync-blocks';
import { EthereumGethSyncService_transactions } from './services/geth/sync-transactions';
import { EthereumGethSyncService_logs } from './services/geth/sync-logs';
import { EthereumGethSyncService_traces } from './services/geth/sync-traces';
import { EthereumERC20SyncService_info } from './services/erc20/sync-info';
import { EthereumERC20SyncService_event_transfer } from './services/erc20/sync-event-transfer';
import { EthereumERC20SyncService_event_approval } from './services/erc20/sync-event-approval';
import { EthereumERC20SyncService_balance_day } from './services/erc20/sync-balance-day';
import { EthereumUniSwapV2SyncService_pairs } from './services/uniswap-v2/sync-pairs';
import { EthereumUniSwapV2SyncService_event_mint } from './services/uniswap-v2/sync-event-mint';
import { EthereumUniSwapV2SyncService_event_burn } from './services/uniswap-v2/sync-event-burn';
import { EthereumUniSwapV2SyncService_event_swap } from './services/uniswap-v2/sync-event-swap';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumTraces } from '@/entities/ethereum-traces';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumERC20BalanceDay } from '@/entities/ethereum-erc20-balance-day';
import { EthereumERC20EventApproval } from '@/entities/ethereum-erc20-event-approval';
import { EthereumERC20EventTransfer } from '@/entities/ethereum-erc20-event-transfer';
import { EthereumUniSwapV2Pair } from '@/entities/ethereum-uniswap-v2-pairs';
import { EthereumUniSwapV2EventMint } from '@/entities/ethereum-uniswap-v2-event-mint';
import { EthereumUniSwapV2EventBurn } from '@/entities/ethereum-uniswap-v2-event-burn';
import { EthereumUniSwapV2EventSwap } from '@/entities/ethereum-uniswap-v2-event-swap';

export const ethereumEntities = [
  EthereumBlocks,
  EthereumTransactions,
  EthereumLogs,
  EthereumTraces,
  EthereumERC20,
  EthereumERC20BalanceDay,
  EthereumERC20EventApproval,
  EthereumERC20EventTransfer,
  EthereumUniSwapV2Pair,
  EthereumUniSwapV2EventMint,
  EthereumUniSwapV2EventBurn,
  EthereumUniSwapV2EventSwap,
];

@Module({
  controllers: [EthereumJsonRpcController],
  providers: [
    EthereumGethService,
    EthereumGethSyncService_blocks,
    EthereumGethSyncService_transactions,
    EthereumGethSyncService_logs,
    EthereumGethSyncService_traces,
    EthereumERC20SyncService_info,
    EthereumERC20SyncService_event_transfer,
    EthereumERC20SyncService_event_approval,
    EthereumERC20SyncService_balance_day,
    EthereumUniSwapV2SyncService_pairs,
    EthereumUniSwapV2SyncService_event_mint,
    EthereumUniSwapV2SyncService_event_burn,
    EthereumUniSwapV2SyncService_event_swap,
    DingTalkSendService,
  ],
  imports: [TypeOrmModule.forFeature(ethereumEntities)],
  exports: [
    EthereumGethService,
    EthereumGethSyncService_blocks,
    EthereumGethSyncService_transactions,
    EthereumGethSyncService_logs,
    EthereumGethSyncService_traces,
  ],
})
export class EthereumModule {}
