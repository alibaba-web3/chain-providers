import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { EthereumGethService } from '../geth';
import { EthereumGethServiceResponse } from '../../types/geth';
import { SyncGethToMysqlRestartTime, EthereumBlockNumberOfFirstTransaction } from '@/constants';
import { isDev } from '@/constants';

@Injectable()
export class EthereumSyncGethToMysqlService_transactions {
  // 当前 geth 已同步的最新区块
  private currentBlockNumber = 0;

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
      this.syncTransactionsFromBlockNumber(transaction.block_number);
    } else {
      this.syncTransactionsFromBlockNumber(EthereumBlockNumberOfFirstTransaction);
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

  async syncTransactionsFromBlockNumber(blockNumber: number) {
    try {
      if (blockNumber > this.currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(async () => {
          this.currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
          this.syncTransactionsFromBlockNumber(blockNumber);
        }, SyncGethToMysqlRestartTime);
      }
      const block = await this.ethereumGethService.eth_getBlockByNumber(blockNumber, true);
      const transactions = block.transactions as EthereumGethServiceResponse.Transaction[];
      if (transactions.length > 0) {
        const transactionReceipts = await Promise.all(
          transactions.map((transaction) => this.ethereumGethService.eth_getTransactionReceipt(transaction.hash)),
        );
        await this.ethereumTransactionsRepository.upsert(
          transactions.map((transaction, i) => ({
            transaction_hash: transaction.hash,
            transaction_index: transaction.transactionIndex,
            block_number: block.number,
            block_hash: block.hash,
            block_timestamp: new Date(block.timestamp),
            from: transaction.from,
            to: transaction.to,
            value: transaction.value,
            input: transaction.input,
            gas_used: transactionReceipts[i].gasUsed,
            gas_price: transaction.gasPrice,
            max_fee_per_gas: transaction.maxFeePerGas,
            max_priority_fee_per_gas: transaction.maxPriorityFeePerGas,
            effective_gas_price: transactionReceipts[i].effectiveGasPrice,
            cumulative_gas_used: transactionReceipts[i].cumulativeGasUsed,
            success: transactionReceipts[i].status === 1,
            nonce: transaction.nonce,
            type: ['Legacy', 'AccessList', 'DynamicFee'][transaction.type],
            access_list: JSON.stringify(transaction.accessList),
          })),
          ['transaction_hash'],
        );
        console.log(`sync transactions (block: ${blockNumber}, tx count: ${transactions.length}) success 🎉`);
      }
    } catch (e) {
      console.log(`sync transactions (block: ${blockNumber}) error:`, e.message);
    }
    this.syncTransactionsFromBlockNumber(blockNumber + 1);
  }
}
