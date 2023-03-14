import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumGethService } from '../geth';
import { EthereumGethServiceResponse } from './types/geth';
import { isDev, isProd, syncRestartTime, ethereumBlockNumberOfFirstTransaction } from '@/constants';
import { debug } from '@/utils';

@Injectable()
export class EthereumGethSyncService_logs {
  constructor(
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
    private ethereumGethService: EthereumGethService,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  @Timeout(0)
  async main() {
    if (isDev) return;
    const log = await this.getLatestLogFromMysql();
    if (log) {
      // 由于 ethereum_logs 除了主键，没有其它能标识唯一行的字段，所以先删掉整个区块的数据再重新 insert 而不是 upsert
      await this.ethereumLogsRepository.delete({ block_number: log.block_number });
      this.syncLogsFromBlockNumber(log.block_number);
    } else {
      this.syncLogsFromBlockNumber(ethereumBlockNumberOfFirstTransaction);
    }
    console.log('start syncing ethereum logs');
  }

  async getLatestLogFromMysql() {
    const [log] = await this.ethereumLogsRepository.find({
      order: {
        block_number: 'DESC',
        transaction_index: 'DESC',
        log_index: 'DESC',
      },
      take: 1,
    });
    return log;
  }

  async syncLogsFromBlockNumber(blockNumber: number) {
    try {
      const currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
      if (blockNumber > currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(() => this.syncLogsFromBlockNumber(blockNumber), syncRestartTime);
      }
      const block = await this.ethereumGethService.eth_getBlockByNumber(blockNumber, true);
      const transactions = block.transactions as EthereumGethServiceResponse.Transaction[];
      if (transactions.length > 0) {
        const transactionReceipts = await Promise.all(
          transactions.map((transaction) => this.ethereumGethService.eth_getTransactionReceipt(transaction.hash)),
        );
        const logEntities = transactions
          .map((transaction, i) =>
            transactionReceipts[i].logs.map((log, j) => ({
              log_index: j,
              transaction_hash: transaction.hash,
              transaction_index: i,
              block_number: block.number,
              block_hash: block.hash,
              block_timestamp: new Date(block.timestamp),
              contract_address: log.address,
              data: log.data,
              topics_count: log.topics.length,
              topic_1: log.topics[0] || '',
              topic_2: log.topics[1] || '',
              topic_3: log.topics[2] || '',
              topic_4: log.topics[3] || '',
            })),
          )
          .flat();
        await this.ethereumLogsRepository.insert(logEntities);
        debug(`sync logs (block: ${blockNumber}, log count: ${logEntities.length}) success 🎉`);
      }
    } catch (e) {
      const errorMessage = `sync logs (block: ${blockNumber}) error: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
    this.syncLogsFromBlockNumber(blockNumber + 1);
  }
}
