import { Injectable } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EthereumBlocks } from '@/entities/ethereum-blocks';
import { DingTalkSendService } from '@/modules/dingtalk/services/send';
import { EthereumGethService } from '../geth';
import { isDev, isProd, syncRestartTime } from '@/constants';
import { debug } from '@/utils';

@Injectable()
export class EthereumGethSyncService_blocks {
  constructor(
    @InjectRepository(EthereumBlocks)
    private ethereumBlocksRepository: Repository<EthereumBlocks>,
    private ethereumGethService: EthereumGethService,
    private dingTalkSendService: DingTalkSendService,
  ) {}

  // @Timeout(0)
  async main() {
    if (isDev) return;
    const block = await this.getLatestBlockFromMysql();
    this.syncBlocksFromNumber(block ? block.block_number + 1 : 0);
    console.log('start syncing ethereum blocks');
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
        base_fee_per_gas: block.baseFeePerGas,
        size: block.size,
        miner: block.miner,
        nonce: block.nonce,
        timestamp: new Date(block.timestamp),
        transactions_count: block.transactions.length,
      });
      debug(`sync block (${start}) success 🎉`);
    } catch (e) {
      const errorMessage = `sync block (${start}) error: ${e.message}`;
      if (isProd) {
        this.dingTalkSendService.sendTextToTestRoom(errorMessage);
      }
      debug(errorMessage);
    }
    this.syncBlocksFromNumber(start + 1);
  }
}
