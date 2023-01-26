import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumGethService } from '../geth';
import { SyncGethToMysqlRestartTime, EthereumBlockNumberOfFirstTransaction } from '@/constants';
import { isDev } from '@/utils';

@Injectable()
export class EthereumSyncGethToMysqlService_logs {
  constructor(
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncLogs() {
    if (isDev) return;
    const log = await this.getLatestLogFromMysql();
    if (log) {
      const next = await this.getNextBlockNumberAndIndexForLog(log.block_number, log.transaction_index, log.log_index);
      await this.syncLogFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex, next.logIndex);
    } else {
      await this.syncLogFromBlockNumberAndIndex(EthereumBlockNumberOfFirstTransaction, 0, 0);
    }
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

  async syncLogFromBlockNumberAndIndex(blockNumber: number, transactionIndex: number, logIndex: number) {
    try {
      const currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
      if (blockNumber > currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(() => this.syncLogFromBlockNumberAndIndex(blockNumber, transactionIndex, logIndex), SyncGethToMysqlRestartTime);
      }
      const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
      // 当 transactionIndex = 0 时，可能没有数据
      if (transaction) {
        const transactionReceipt = await this.ethereumGethService.eth_getTransactionReceipt(transaction.hash);
        const log = transactionReceipt.logs[logIndex];
        // 当 logIndex = 0 时，可能没有数据
        if (log) {
          const block = await this.ethereumGethService.eth_getBlockByNumber(blockNumber);
          await this.ethereumLogsRepository.insert({
            log_index: logIndex,
            transaction_hash: transaction.hash,
            transaction_index: transaction.transactionIndex,
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
          });
          console.log(`sync log (block: ${blockNumber}, tx index: ${transactionIndex}, log index: ${logIndex}) success 🎉`);
        }
      }
    } catch (e) {
      console.log(`sync log (block: ${blockNumber}, tx index: ${transactionIndex}, log index: ${logIndex}) error:`, e.message);
    }
    const next = await this.getNextBlockNumberAndIndexForLog(blockNumber, transactionIndex, logIndex);
    await this.syncLogFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex, next.logIndex);
  }

  async getNextBlockNumberAndIndexForLog(blockNumber: number, transactionIndex: number, logIndex: number) {
    const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
    if (transaction) {
      const transactionReceipt = await this.ethereumGethService.eth_getTransactionReceipt(transaction.hash);
      if (logIndex < transactionReceipt.logs.length - 1) {
        return { blockNumber, transactionIndex, logIndex: logIndex + 1 };
      }
    }
    const transactionCount = await this.ethereumGethService.eth_getBlockTransactionCountByNumber(blockNumber);
    if (transactionIndex < transactionCount - 1) {
      return { blockNumber, transactionIndex: transactionIndex + 1, logIndex: 0 };
    } else {
      return { blockNumber: blockNumber + 1, transactionIndex: 0, logIndex: 0 };
    }
  }
}
