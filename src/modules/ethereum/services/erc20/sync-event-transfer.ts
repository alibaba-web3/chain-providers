import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumGethSyncService_logs } from '@/modules/ethereum/services/geth/sync-logs';
import { EthereumERC20 } from '@/entities/ethereum-erc20';
import { EthereumERC20EventTransfer } from '@/entities/ethereum-erc20-event-transfer';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { isDev, isProd, syncRestartTime } from '@/constants';
import { debug } from '@/utils';
import { ethers, BigNumber } from 'ethers';

@Injectable()
export class EthereumERC20SyncService_event_transfer {
  constructor(
    @InjectRepository(EthereumERC20)
    private ethereumERC20Repository: Repository<EthereumERC20>,
    @InjectRepository(EthereumERC20EventTransfer)
    private ethereumERC20EventTransferRepository: Repository<EthereumERC20EventTransfer>,
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
    private ethereumGethSyncService_logs: EthereumGethSyncService_logs,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  // 记录 ethereum_logs 表的同步进度
  private latestLogBlockNumber: number;

  // @Timeout(0)
  async main() {
    if (isDev) return;
    console.log('start syncing erc20 transfer events');
    const [latestLog, tokens] = await Promise.all([this.ethereumGethSyncService_logs.getLatestLogFromMysql(), this.ethereumERC20Repository.find()]);
    this.latestLogBlockNumber = latestLog.block_number;
    tokens.forEach(({ contract_address, creation_transaction_hash }) => {
      this.syncTransferEvents(contract_address, creation_transaction_hash);
    });
  }

  async syncTransferEvents(contractAddress: string, creationTransactionHash: string) {
    const event = await this.getLatestTransferEventFromMysql(contractAddress);
    if (event) {
      // 由于除了主键，没有其它能标识唯一行的字段，所以先删掉整个区块的数据再重新 insert 而不是 upsert
      await this.ethereumERC20EventTransferRepository.delete({
        contract_address: contractAddress,
        block_number: event.block_number,
      });
      this.syncTransferEventsFromBlockNumber(contractAddress, event.block_number);
    } else {
      const creationTransaction = await this.ethereumTransactionsRepository.findOneBy({
        transaction_hash: creationTransactionHash,
      });
      if (creationTransaction) {
        this.syncTransferEventsFromBlockNumber(contractAddress, creationTransaction.block_number);
      } else {
        console.log(`sync erc20 transfer events failed. creation transaction not found: ${creationTransactionHash}`);
      }
    }
  }

  async getLatestTransferEventFromMysql(contractAddress: string) {
    const [event] = await this.ethereumERC20EventTransferRepository.find({
      where: { contract_address: contractAddress },
      order: { block_number: 'DESC' },
      take: 1,
    });
    return event;
  }

  // 推荐阅读：理解以太坊的 event logs
  // https://medium.com/mycrypto/understanding-event-logs-on-the-ethereum-blockchain-f4ae7ba50378
  async syncTransferEventsFromBlockNumber(contractAddress: string, blockNumber: number) {
    if (blockNumber >= this.latestLogBlockNumber) {
      // 没有数据了，等一段时间后有新的数据了再重新开始
      return setTimeout(async () => {
        const latestLog = await this.ethereumGethSyncService_logs.getLatestLogFromMysql();
        this.latestLogBlockNumber = latestLog.block_number;
        this.syncTransferEventsFromBlockNumber(contractAddress, blockNumber);
      }, syncRestartTime);
    }
    try {
      const logs = await this.ethereumLogsRepository.findBy({
        contract_address: contractAddress,
        block_number: blockNumber,
        topic_1: ethers.utils.id('Transfer(address,address,uint256)'),
      });
      if (logs.length > 0) {
        const eventEntities = logs.map((log) => ({
          contract_address: log.contract_address,
          from: `0x${log.topic_2.slice(-40)}`,
          to: `0x${log.topic_3.slice(-40)}`,
          value: BigNumber.from(log.data),
          block_number: log.block_number,
          block_timestamp: log.block_timestamp,
          transaction_index: log.transaction_index,
          transaction_hash: log.transaction_hash,
          log_index: log.log_index,
        }));
        await this.ethereumERC20EventTransferRepository.insert(eventEntities);
        debug(`sync erc20 transfer events (contract: ${contractAddress}, block: ${blockNumber}, event count: ${eventEntities.length}) success 🎉`);
      }
    } catch (e) {
      const errorMessage = `sync erc20 transfer events (contract: ${contractAddress}, block: ${blockNumber}) error: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
    this.syncTransferEventsFromBlockNumber(contractAddress, blockNumber + 1);
  }
}
