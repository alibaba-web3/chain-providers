import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumLogs } from '@/entities/ethereum-logs';
import { EthereumGethService } from './geth';
import { isDev } from '@/utils';

// 在已有数据同步完成时，程序会自动停止，然后讲在此时段后重新开始同步新的数据，以保证持续跟上进度
const syncRestartTime = 60 * 60 * 1000;

// 以太坊的第一条交易在 https://etherscan.io/block/46147
const blockNumberOfFirstTransaction = 46147;

@Injectable()
export class EthereumGethToMysqlService {
  constructor(
    @InjectRepository(EthereumBlocks)
    private ethereumBlocksRepository: Repository<EthereumBlocks>,
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    @InjectRepository(EthereumLogs)
    private ethereumLogsRepository: Repository<EthereumLogs>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncBlocks() {
    if (isDev) return;
    const block = await this.getLatestBlockFromMysql();
    await this.syncBlocksFromNumber(block ? block.block_number + 1 : 0);
  }

  async getLatestBlockFromMysql() {
    const [block] = await this.ethereumBlocksRepository.find({
      order: {
        block_number: 'DESC',
      },
      take: 1,
    });
    return block;
  }

  async syncBlocksFromNumber(start: number) {
    try {
      const block = await this.ethereumGethService.eth_getBlockByNumber(start);
      if (!block) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(() => this.syncBlocksFromNumber(start), syncRestartTime);
      }
      await this.ethereumBlocksRepository.insert({
        block_number: block.number,
        block_hash: block.hash,
        parent_block_hash: block.parentHash,
        gas_limit: block.gasLimit,
        gas_used: block.gasUsed,
        base_fee_per_gas: block.baseFeePerGas || 0,
        size: block.size,
        miner: block.miner,
        nonce: block.nonce,
        timestamp: new Date(block.timestamp),
        transactions_count: block.transactions.length,
      });
      console.log(`sync block (${start}) success 🎉`);
    } catch (e) {
      console.log(`sync block (${start}) error:`, e.message);
    }
    await this.syncBlocksFromNumber(start + 1);
  }

  @Timeout(0)
  async syncTransactions() {
    if (isDev) return;
    const transaction = await this.getLatestTransactionFromMysql();
    if (transaction) {
      const next = await this.getNextBlockNumberAndIndex(transaction.block_number, transaction.transaction_index);
      await this.syncTransactionFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex);
    } else {
      await this.syncTransactionFromBlockNumberAndIndex(blockNumberOfFirstTransaction, 0);
    }
  }

  async getLatestTransactionFromMysql() {
    const [transaction] = await this.ethereumTransactionsRepository.find({
      order: {
        block_number: 'DESC',
        transaction_index: 'DESC',
      },
      take: 1,
    });
    return transaction;
  }

  async syncTransactionFromBlockNumberAndIndex(blockNumber: number, transactionIndex: number) {
    try {
      const currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
      if (blockNumber > currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(() => this.syncTransactionFromBlockNumberAndIndex(blockNumber, transactionIndex), syncRestartTime);
      }
      const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
      if (transaction) {
        const block = await this.ethereumGethService.eth_getBlockByNumber(blockNumber);
        const transactionReceipt = await this.ethereumGethService.eth_getTransactionReceipt(transaction.hash);
        await this.ethereumTransactionsRepository.insert({
          transaction_hash: transaction.hash,
          transaction_index: transaction.transactionIndex,
          block_number: block.number,
          block_hash: block.hash,
          block_timestamp: new Date(block.timestamp),
          from: transaction.from,
          to: transaction.to,
          value: transaction.value,
          input: transaction.input,
          gas_used: transactionReceipt.gasUsed,
          gas_price: transaction.gasPrice,
          max_fee_per_gas: transaction.maxFeePerGas,
          max_priority_fee_per_gas: transaction.maxPriorityFeePerGas,
          effective_gas_price: transactionReceipt.effectiveGasPrice,
          cumulative_gas_used: transactionReceipt.cumulativeGasUsed,
          success: transactionReceipt.status === 1,
          nonce: transaction.nonce,
          type: ['Legacy', 'AccessList', 'DynamicFee'][transaction.type],
          access_list: JSON.stringify(transaction.accessList),
        });
        console.log(`sync transaction (block: ${blockNumber}, index: ${transactionIndex}) success 🎉`);
      }
    } catch (e) {
      console.log(`sync transaction (block: ${blockNumber}, index: ${transactionIndex}) error:`, e.message);
    }
    const next = await this.getNextBlockNumberAndIndex(blockNumber, transactionIndex);
    await this.syncTransactionFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex);
  }

  async getNextBlockNumberAndIndex(blockNumber: number, transactionIndex: number) {
    const transactionCount = await this.ethereumGethService.eth_getBlockTransactionCountByNumber(blockNumber);
    return transactionIndex < transactionCount - 1
      ? { blockNumber, transactionIndex: transactionIndex + 1 }
      : { blockNumber: blockNumber + 1, transactionIndex: 0 };
  }

  @Timeout(0)
  async syncLogs() {
    if (isDev) return;
    const log = await this.getLatestLogFromMysql();
    if (log) {
      const next = await this.getNextBlockNumberAndIndexForLog(log.block_number, log.transaction_index, log.log_index);
      await this.syncLogFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex, next.logIndex);
    } else {
      await this.syncLogFromBlockNumberAndIndex(blockNumberOfFirstTransaction, 0, 0);
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
        return setTimeout(() => this.syncLogFromBlockNumberAndIndex(blockNumber, transactionIndex, logIndex), syncRestartTime);
      }
      const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
      if (transaction) {
        const transactionReceipt = await this.ethereumGethService.eth_getTransactionReceipt(transaction.hash);
        const log = transactionReceipt.logs[logIndex];
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
          console.log(`sync transaction (block: ${blockNumber}, tx index: ${transactionIndex}, log index: ${logIndex}) success 🎉`);
        }
      }
    } catch (e) {
      console.log(`sync transaction (block: ${blockNumber}, tx index: ${transactionIndex}, log index: ${logIndex}) error:`, e.message);
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
