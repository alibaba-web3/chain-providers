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
  constructor(
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncTransactions() {
    if (isDev) return;
    const transaction = await this.getLatestTransactionFromMysql();
    if (transaction) {
      const next = await this.getNextBlockNumberAndIndex(transaction.block_number, transaction.transaction_index);
      await this.syncTransactionFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex);
    } else {
      await this.syncTransactionFromBlockNumberAndIndex(EthereumBlockNumberOfFirstTransaction, 0);
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
        return setTimeout(() => this.syncTransactionFromBlockNumberAndIndex(blockNumber, transactionIndex), SyncGethToMysqlRestartTime);
      }
      const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
      // 当 transactionIndex = 0 时，可能没有数据
      if (transaction) {
        const [block, transactionReceipt] = await Promise.all([
          this.ethereumGethService.eth_getBlockByNumber(blockNumber),
          this.ethereumGethService.eth_getTransactionReceipt(transaction.hash),
        ]);
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
        console.log(`sync transaction (block: ${blockNumber}, tx index: ${transactionIndex}) success 🎉`);
      }
    } catch (e) {
      console.log(`sync transaction (block: ${blockNumber}, tx index: ${transactionIndex}) error:`, e.message);
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
