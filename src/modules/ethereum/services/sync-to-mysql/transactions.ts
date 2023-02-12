import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumTransactions } from '@/entities/ethereum-transactions';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumGethService } from '../geth';
import { EthereumGethServiceResponse } from '../../types/geth';
import { isDev, isProd, syncRestartTime, ethereumBlockNumberOfFirstTransaction } from '@/constants';
import { debug } from '@/utils';

@Injectable()
export class EthereumSyncGethToMysqlService_transactions {
  constructor(
    @InjectRepository(EthereumTransactions)
    private ethereumTransactionsRepository: Repository<EthereumTransactions>,
    private ethereumGethService: EthereumGethService,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  @Timeout(0)
  async main() {
    if (isDev) return;
    const transaction = await this.getLatestTransactionFromMysql();
    if (transaction) {
      this.syncTransactionsFromBlockNumber(transaction.block_number);
    } else {
      this.syncTransactionsFromBlockNumber(ethereumBlockNumberOfFirstTransaction);
    }
    console.log('start syncing ethereum transactions');
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
      const currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
      if (blockNumber > currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(() => this.syncTransactionsFromBlockNumber(blockNumber), syncRestartTime);
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
        debug(`sync transactions (block: ${blockNumber}, tx count: ${transactions.length}) success 🎉`);
      }
    } catch (e) {
      const errorMessage = `sync transactions (block: ${blockNumber}) error: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
    this.syncTransactionsFromBlockNumber(blockNumber + 1);
  }
}
