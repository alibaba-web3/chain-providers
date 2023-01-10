import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumGethService } from './geth';
import { isDev } from '@/utils';

const SYNC_RESTART_TIME = 60 * 60 * 1000;

@Injectable()
export class EthereumGethToMysqlService {
  constructor(
    @InjectRepository(EthereumBlocks)
    private ethereumBlocksRepository: Repository<EthereumBlocks>,
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
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
        return setTimeout(() => this.syncBlocksFromNumber(start), SYNC_RESTART_TIME);
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
      // 以太坊的第一条交易在 https://etherscan.io/block/46147
      await this.syncTransactionFromBlockNumberAndIndex(46147, 0);
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
        return setTimeout(() => this.syncTransactionFromBlockNumberAndIndex(blockNumber, transactionIndex), SYNC_RESTART_TIME);
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
}
