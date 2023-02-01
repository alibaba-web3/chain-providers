import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumGethService } from '../geth';
import { SyncGethToMysqlRestartTime, EthereumBlockNumberOfFirstTransaction } from '@/constants';
import { isDev } from '@/utils';

@Injectable()
export class EthereumSyncGethToMysqlService_transactions {
  // 当前 geth 已同步的最新区块
  private currentBlockNumber = 0;

  // 缓存一下区块包含的交易数量 blockNumber => transactionCount
  private transactionCounts = new Map<number, number>();

  constructor(
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncTransactions() {
    if (isDev) return;
    const [transaction, blockNumber] = await Promise.all([this.getLatestTransactionFromMysql(), this.ethereumGethService.eth_blockNumber()]);
    this.currentBlockNumber = blockNumber;
    if (transaction) {
      const next = await this.getNextBlockNumberAndIndex(transaction.block_number, transaction.transaction_index);
      this.syncTransactionFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex);
    } else {
      this.syncTransactionFromBlockNumberAndIndex(EthereumBlockNumberOfFirstTransaction, 0);
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
      if (blockNumber > this.currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(async () => {
          this.currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
          this.syncTransactionFromBlockNumberAndIndex(blockNumber, transactionIndex);
        }, SyncGethToMysqlRestartTime);
      }
      const block = await this.ethereumGethService.eth_getBlockByNumber(blockNumber, true);
      // transactions 早期区块可能为空
      if (block && block.transactions.length > 0) {
        const transactionEntityArr = await Promise.all(block.transactions.map((transaction) => this.parseTransaction(block, transaction)));
        await this.ethereumTransactionsRepository.insert(transactionEntityArr);
        console.log(`sync transaction (block: ${blockNumber}, tx index: ${transactionIndex}) success 🎉`);
      }
    } catch (e) {
      console.log(`sync transaction (block: ${blockNumber}, tx index: ${transactionIndex}) error:`, e.message);
    }
    const next = await this.getNextBlockNumberAndIndex(blockNumber, transactionIndex);
    this.syncTransactionFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex);
  }

  async parseTransaction(block, transaction) {
    const transactionReceipt = await this.ethereumGethService.eth_getTransactionReceipt(transaction.hash);
    return {
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
    };
  }

  async getNextBlockNumberAndIndex(blockNumber: number, transactionIndex: number) {
    const transactionCount = await this.getTransactionCount(blockNumber);
    return transactionIndex < transactionCount - 1
      ? { blockNumber, transactionIndex: transactionIndex + 1 }
      : { blockNumber: blockNumber + 1, transactionIndex: 0 };
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
