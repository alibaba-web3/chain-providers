import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumGethService } from '../geth';
import { SyncGethToMysqlRestartTime } from '@/constants';
import { isDev } from '@/constants';

@Injectable()
export class EthereumSyncGethToMysqlService_blocks {
  constructor(
    @InjectRepository(EthereumBlocks)
    private ethereumBlocksRepository: Repository<EthereumBlocks>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncBlocks() {
    if (isDev) return;
    const block = await this.getLatestBlockFromMysql();
    this.syncBlocksFromNumber(block ? block.block_number + 1 : 0);
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
        return setTimeout(() => this.syncBlocksFromNumber(start), SyncGethToMysqlRestartTime);
      }
      await this.ethereumBlocksRepository.insert({
        block_number: block.number,
        block_hash: block.hash,
        parent_block_hash: block.parentHash,
        gas_limit: block.gasLimit,
        gas_used: block.gasUsed,
        base_fee_per_gas: block.baseFeePerGas,
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
    this.syncBlocksFromNumber(start + 1);
  }
}
