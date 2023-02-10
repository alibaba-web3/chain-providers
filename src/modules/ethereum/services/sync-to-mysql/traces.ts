import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumTraces } from '@/entities/ethereum-traces';
import { EthereumGethService } from '../geth';
import { EthereumGethServiceResponse } from '../../types/geth';
import { isDev, syncGethToMysqlRestartTime, ethereumBlockNumberOfFirstTransaction, ethereumTracesSyncStep } from '@/constants';
import { debug } from '@/utils';

@Injectable()
export class EthereumSyncGethToMysqlService_traces {
  constructor(
    @InjectRepository(EthereumTraces)
    private ethereumTracesRepository: Repository<EthereumTraces>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncTraces() {
    if (isDev) return;
    const traces = await this.getLatestNTraceFromMysql(ethereumTracesSyncStep);
    if (traces.length > 0) {
      // 由于 ethereum_traces 除了主键，没有其它能标识唯一行的字段，所以先删掉整个区块的数据再重新 insert 而不是 upsert
      const lastSyncBlockNumber = traces[traces.length - 1].block_number;
      await this.deleteTracesByBlockNumberRange(traces[0].block_number, lastSyncBlockNumber);
      this.syncTracesFromBlockNumberByStep(lastSyncBlockNumber, lastSyncBlockNumber + ethereumTracesSyncStep);
    } else {
      this.syncTracesFromBlockNumberByStep(ethereumBlockNumberOfFirstTransaction, ethereumBlockNumberOfFirstTransaction + ethereumTracesSyncStep);
    }
  }

  async deleteTracesByBlockNumberRange(startBlockNumber: number, endBlockNumber: number) {
    this.ethereumTracesRepository
      .createQueryBuilder('trace')
      .where('trace.block_number >= :start', { start: startBlockNumber })
      .andWhere('trace.block_number <= :end', { end: endBlockNumber })
      .delete();
  }

  async getLatestNTraceFromMysql(step: number) {
    const traces = await this.ethereumTracesRepository
      .createQueryBuilder('trace')
      .groupBy('trace.block_number')
      .orderBy('trace.block_number', 'DESC')
      .limit(step)
      .getMany();
    return traces;
  }

  async getLatestTraceFromMysql() {
    const [trace] = await this.ethereumTracesRepository.find({
      order: {
        block_number: 'DESC',
        transaction_index: 'DESC',
        // 实际上 traces 还有一层根据 trace_address 排序，此处忽略
      },
      take: 1,
    });
    return trace;
  }

  async syncTracesFromBlockNumberByStep(startBlockNumber: number, endBlockNumber: number) {
    try {
      endBlockNumber = Math.max(startBlockNumber, endBlockNumber);
      const currentBlockNumber = await this.ethereumGethService.eth_blockNumber();
      if (startBlockNumber > currentBlockNumber) {
        // 没有数据了，等一段时间后有新的数据了再重新开始
        return setTimeout(() => this.syncTracesFromBlockNumberByStep(startBlockNumber, endBlockNumber), syncGethToMysqlRestartTime);
      }
      endBlockNumber = Math.min(currentBlockNumber, endBlockNumber);
      let blockNumber = startBlockNumber;
      const blockNumbers = [];
      while (blockNumber < endBlockNumber) {
        blockNumbers.push(blockNumber++);
      }
      if (blockNumbers.length > 0) {
        await Promise.all(blockNumbers.map((blockNumber) => this.syncTracesFromBlockNumber(blockNumber)));
      }
    } catch (e) {
      console.log(`sync traces (start: ${startBlockNumber}, end: ${endBlockNumber}) error:`, e.message);
    }
    this.syncTracesFromBlockNumberByStep(endBlockNumber, endBlockNumber + ethereumTracesSyncStep);
  }

  async syncTracesFromBlockNumber(blockNumber: number) {
    try {
      const block = await this.ethereumGethService.eth_getBlockByNumber(blockNumber, true);
      const transactions = block.transactions as EthereumGethServiceResponse.Transaction[];
      if (transactions.length > 0) {
        const traceEntities = (await Promise.all(transactions.map((transaction) => this.getTraceEntities(block, transaction)))).flat();
        if (traceEntities.length > 0) {
          await this.ethereumTracesRepository.insert(traceEntities);
          debug(`sync traces (block: ${blockNumber}, trace count: ${traceEntities.length}) success 🎉`);
        }
      }
    } catch (e) {
      debug(`sync traces (block: ${blockNumber}) error:`, e.message);
    }
  }

  async getTraceEntities(block: EthereumGethServiceResponse.Block, transaction: EthereumGethServiceResponse.Transaction) {
    const [{ calls }, transactionReceipt] = await Promise.all([
      this.ethereumGethService.debug_traceTransaction_callTracer(transaction.hash),
      this.ethereumGethService.eth_getTransactionReceipt(transaction.hash),
    ]);
    return this.transformTraceEntities(calls, {
      transaction_hash: transaction.hash,
      transaction_index: transaction.transactionIndex,
      transaction_success: transactionReceipt.status === 1,
      block_number: block.number,
      block_hash: block.hash,
      block_timestamp: new Date(block.timestamp),
    });
  }

  transformTraceEntities(
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
    if (!calls || calls.length === 0) return [];
    let traceEntities: Partial<EthereumTraces>[] = [];
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const traceAddress = parentTraceAddress.concat(i);
      traceEntities.push({
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
      const childrenTraceEntities = this.transformTraceEntities(call.calls, commonInfo, traceAddress);
      traceEntities = traceEntities.concat(childrenTraceEntities);
    }
    return traceEntities;
  }
}
