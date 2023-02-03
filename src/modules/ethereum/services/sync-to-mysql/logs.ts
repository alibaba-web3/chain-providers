import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumGethService } from '../geth';
import { EthereumGethServiceResponse } from '../../types/geth';
import { SyncGethToMysqlRestartTime, EthereumBlockNumberOfFirstTransaction } from '@/constants';
import { isDev } from '@/constants';

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
      // 由于 ethereum_logs 除了主键，没有其它能标识唯一行的字段，所以先删掉整个区块的数据再重新 insert 而不是 upsert
      await this.ethereumLogsRepository.delete({ block_number: log.block_number });
      this.syncLogsFromBlockNumber(log.block_number);
    } else {
      this.syncLogsFromBlockNumber(EthereumBlockNumberOfFirstTransaction);
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

  async syncLogsFromBlockNumber(blockNumber: number) {
    try {
      const currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
      if (blockNumber > currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(() => this.syncLogsFromBlockNumber(blockNumber), SyncGethToMysqlRestartTime);
      }
      const block = await this.ethereumGethService.eth_getBlockByNumber(blockNumber, true);
      const transactions = block.transactions as EthereumGethServiceResponse.Transaction[];
      if (transactions.length > 0) {
        const transactionReceipts = await Promise.all(
          transactions.map((transaction) => this.ethereumGethService.eth_getTransactionReceipt(transaction.hash)),
        );
        const logEntities = transactionReceipts
          .map((transactionReceipt, transactionIndex) => {
            return transactionReceipt.logs.map((log, logIndex) => ({
              log_index: logIndex,
              transaction_hash: transactions[transactionIndex].hash,
              transaction_index: transactions[transactionIndex].transactionIndex,
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
            }));
          })
          .flat();
        await this.ethereumLogsRepository.insert(logEntities);
        console.log(`sync log (block: ${blockNumber}, log count: ${logEntities.length}) success 🎉`);
      }
    } catch (e) {
      console.log(`sync log (block: ${blockNumber}) error:`, e.message);
    }
    this.syncLogsFromBlockNumber(blockNumber + 1);
  }
}
