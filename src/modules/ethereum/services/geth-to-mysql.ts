import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { EthereumGethService } from './geth';
import { isDev } from '@/utils';

@Injectable()
export class EthereumGethToMysqlService {
  constructor(
    @InjectRepository(EthereumBlocks)
    private blocksRepository: Repository<EthereumBlocks>,
    private ethereumGethService: EthereumGethService,
  ) {}

  @Timeout(0)
  async syncBlocks() {
    if (isDev) {
      return console.log('[dev] stop syncBlocks');
    }
    const block = await this.getLatestBlockFromMysql();
    await this.syncBlocksFromNumber(block ? block.block_number + 1 : 0);
  }

  async getLatestBlockFromMysql() {
    const [block] = await this.blocksRepository.find({
      order: {
        block_number: 'DESC',
      },
      take: 1,
    });
    return block;
  }

  async syncBlocksFromNumber(start: number) {
    console.log(`\nsync block (${start})`);
    try {
      const block = await this.ethereumGethService.eth_getBlockByNumber(start);
      if (!block) return;
      await this.blocksRepository.insert({
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
}
