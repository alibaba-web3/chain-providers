import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumGethService } from '../geth';
import { SyncGethToMysqlRestartTime, EthereumBlockNumberOfFirstTransaction } from '@/constants';
import { isDev } from '@/constants';

@Injectable()
export class EthereumSyncGethToMysqlService_logs {
  // 当前 geth 已同步的最新区块
  private currentBlockNumber = 0;

  // 缓存一下区块包含的交易数量 blockNumber => transactionCount
  private transactionCounts = new Map<number, number>();

  // 缓存一下交易包含的日志数量 blockNumber + transactionIndex => logCount
  private logCounts = new Map<string, number>();

  constructor(
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncLogs() {
    if (isDev) return;
    const [log, blockNumber] = await Promise.all([this.getLatestLogFromMysql(), this.ethereumGethService.eth_blockNumber()]);
    this.currentBlockNumber = blockNumber;
    if (log) {
      const next = await this.getNextBlockNumberAndIndex(log.block_number, log.transaction_index, log.log_index);
      this.syncLogFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex, next.logIndex);
    } else {
      this.syncLogFromBlockNumberAndIndex(EthereumBlockNumberOfFirstTransaction, 0, 0);
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
      if (blockNumber > this.currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(async () => {
          this.currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
          this.syncLogFromBlockNumberAndIndex(blockNumber, transactionIndex, logIndex);
        }, SyncGethToMysqlRestartTime);
      }
      const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
      // 当 transactionIndex = 0 时，可能没有数据
      if (transaction) {
        const [transactionReceipt, block] = await Promise.all([
          this.ethereumGethService.eth_getTransactionReceipt(transaction.hash),
          this.ethereumGethService.eth_getBlockByNumber(blockNumber),
        ]);
        const log = transactionReceipt.logs[logIndex];
        // 当 logIndex = 0 时，可能没有数据
        if (log) {
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
    const next = await this.getNextBlockNumberAndIndex(blockNumber, transactionIndex, logIndex);
    this.syncLogFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex, next.logIndex);
  }

  async getNextBlockNumberAndIndex(blockNumber: number, transactionIndex: number, logIndex: number) {
    const logCount = await this.getLogCount(blockNumber, transactionIndex);
    if (logIndex < logCount - 1) {
      return { blockNumber, transactionIndex, logIndex: logIndex + 1 };
    }
    const transactionCount = await this.getTransactionCount(blockNumber);
    if (transactionIndex < transactionCount - 1) {
      return { blockNumber, transactionIndex: transactionIndex + 1, logIndex: 0 };
    } else {
      return { blockNumber: blockNumber + 1, transactionIndex: 0, logIndex: 0 };
    }
  }

  async getLogCount(blockNumber: number, transactionIndex: number) {
    let logCount = 0;
    const key = `${blockNumber}.${transactionIndex}`;
    if (this.logCounts.has(key)) {
      logCount = this.logCounts.get(key);
    } else {
      const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
      if (transaction) {
        const transactionReceipt = await this.ethereumGethService.eth_getTransactionReceipt(transaction.hash);
        logCount = transactionReceipt.logs.length;
      }
      this.logCounts.set(key, logCount);
    }
    return logCount;
  }

  async getTransactionCount(blockNumber: number) {
    let transactionCount = 0;
    if (this.transactionCounts.has(blockNumber)) {
      transactionCount = this.transactionCounts.get(blockNumber);
    } else {
      transactionCount = await this.ethereumGethService.eth_getBlockTransactionCountByNumber(blockNumber);
      this.transactionCounts.set(blockNumber, transactionCount);
    }
    return transactionCount;
  }
}
