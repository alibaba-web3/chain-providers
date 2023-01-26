import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumTraces } from '@/entities/ethereum-traces';
import { EthereumGethService } from '../geth';
import { EthereumGethServiceResponse } from '../../types/geth';
import { SyncGethToMysqlRestartTime, EthereumBlockNumberOfFirstTransaction } from '@/constants';
import { isDev } from '@/utils';

@Injectable()
export class EthereumSyncGethToMysqlService_traces {
  // 当前 geth 已同步的最新区块
  private currentBlockNumber = 0;

  // 缓存一下区块包含的交易数量 blockNumber => transactionCount
  private transactionCounts = new Map<number, number>();

  constructor(
    @InjectRepository(EthereumTraces)
    private ethereumTracesRepository: Repository<EthereumTraces>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncTraces() {
    if (isDev) return;
    const [trace, blockNumber] = await Promise.all([this.getLatestTraceFromMysql(), this.ethereumGethService.eth_blockNumber()]);
    this.currentBlockNumber = blockNumber;
    if (trace) {
      await this.deleteTracesOfBlockNumberAndIndex(trace.block_number, trace.transaction_index);
      this.syncTracesFromBlockNumberAndIndex(trace.block_number, trace.transaction_index);
    } else {
      this.syncTracesFromBlockNumberAndIndex(EthereumBlockNumberOfFirstTransaction, 0);
    }
  }

  async getLatestTraceFromMysql() {
    const [trace] = await this.ethereumTracesRepository.find({
      order: {
        block_number: 'DESC',
        transaction_index: 'DESC',
      },
      take: 1,
    });
    return trace;
  }

  async deleteTracesOfBlockNumberAndIndex(blockNumber: number, transactionIndex: number) {
    await this.ethereumTracesRepository.delete({
      block_number: blockNumber,
      transaction_index: transactionIndex,
    });
  }

  async syncTracesFromBlockNumberAndIndex(blockNumber: number, transactionIndex: number) {
    try {
      if (blockNumber > this.currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(async () => {
          this.currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
          this.syncTracesFromBlockNumberAndIndex(blockNumber, transactionIndex);
        }, SyncGethToMysqlRestartTime);
      }
      const transaction = await this.ethereumGethService.eth_getTransactionByBlockNumberAndIndex(blockNumber, transactionIndex);
      // 当 transactionIndex = 0 时，可能没有数据
      if (transaction) {
        const { calls } = await this.ethereumGethService.debug_traceTransaction_callTracer(transaction.hash);
        if (calls.length > 0) {
          const [transactionReceipt, block] = await Promise.all([
            this.ethereumGethService.eth_getTransactionReceipt(transaction.hash),
            this.ethereumGethService.eth_getBlockByNumber(blockNumber),
          ]);
          await this.insertTraces(calls, {
            transaction_hash: transaction.hash,
            transaction_index: transaction.transactionIndex,
            transaction_success: transactionReceipt.status === 1,
            block_number: block.number,
            block_hash: block.hash,
            block_timestamp: new Date(block.timestamp),
          });
          console.log(`sync traces (block: ${blockNumber}, tx index: ${transactionIndex}) success 🎉`);
        }
      }
    } catch (e) {
      console.log(`sync traces (block: ${blockNumber}, tx index: ${transactionIndex}) error:`, e.message);
    }
    const next = await this.getNextBlockNumberAndIndex(blockNumber, transactionIndex);
    this.syncTracesFromBlockNumberAndIndex(next.blockNumber, next.transactionIndex);
  }

  async insertTraces(
    calls: EthereumGethServiceResponse.TraceTransaction[],
    commonInfo: {
      transaction_hash: string;
      transaction_index: number;
      transaction_success: boolean;
      block_number: number;
      block_hash: string;
      block_timestamp: Date;
    },
    parentTraceAddress: number[] = [],
  ) {
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const traceAddress = parentTraceAddress.concat(i);
      await this.ethereumTracesRepository.insert({
        ...commonInfo,
        trace_address: JSON.stringify(traceAddress),
        trace_children_count: call.calls.length,
        trace_success: !call.error,
        type: call.type,
        from: call.from,
        to: call.to,
        value: call.value,
        gas_limit: call.gas,
        gas_used: call.gasUsed,
        input: call.input,
        output: call.output,
        method_id: call.input.length >= 10 ? call.input.slice(2, 10) : '',
        error: call.error,
      });
      if (call.calls.length > 0) {
        await this.insertTraces(call.calls, commonInfo, traceAddress);
      }
    }
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
